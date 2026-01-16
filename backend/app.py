"""
Attendance Processing System - Web Interface
Upload biometric attendance files and get instant calculations
"""

import streamlit as st
import pandas as pd
from attendance_processor import AttendanceProcessor
import os
from datetime import datetime
import io

# Page configuration
st.set_page_config(
    page_title="Attendance Processing System",
    page_icon="📊",
    layout="wide"
)

# Custom CSS for better styling
st.markdown("""
    <style>
    .main-header {
        font-size: 2.5rem;
        color: #1f77b4;
        text-align: center;
        margin-bottom: 1rem;
    }
    .sub-header {
        font-size: 1.2rem;
        color: #555;
        text-align: center;
        margin-bottom: 2rem;
    }
    .stAlert {
        margin-top: 1rem;
    }
    </style>
""", unsafe_allow_html=True)

# Header
st.markdown('<p class="main-header">📊 Attendance Processing System</p>', unsafe_allow_html=True)
st.markdown('<p class="sub-header">Upload biometric attendance files and get instant hour calculations</p>', unsafe_allow_html=True)

# Sidebar for configuration
with st.sidebar:
    st.header("⚙️ Configuration")
    
    # Year selection
    current_year = datetime.now().year
    year = st.selectbox(
        "Select Year",
        options=list(range(current_year - 2, current_year + 2)),
        index=2  # Default to current year
    )
    
    # Month selection
    month = st.selectbox(
        "Select Month",
        options=list(range(1, 13)),
        format_func=lambda x: datetime(2000, x, 1).strftime("%B"),
        index=datetime.now().month - 1  # Default to current month
    )
    
    # Max hours per day
    st.subheader("Work Hours Configuration")
    max_hours = st.radio(
        "Standard Hours Per Day",
        options=[8.0, 10.0, 12.0, 14.0],
        index=0,
        help="Select the standard work hours for auto-assignment when punch-out is missing"
    )
    
    st.markdown("---")
    st.markdown("### 📖 Quick Guide")
    st.markdown("""
    1. **Upload** your Excel file
    2. **Configure** year, month, and hours
    3. **Process** to calculate attendance
    4. **Download** the formatted report
    
    **Supported scenarios:**
    - ✅ Normal punch pairs
    - ✅ Missing punch-outs
    - ✅ Multiple punches
    - ✅ Corrupted data
    - ✅ Absent employees
    """)

# Main content area
col1, col2 = st.columns([1, 1])

with col1:
    st.subheader("📁 Upload Attendance File")
    uploaded_file = st.file_uploader(
        "Choose an Excel file (.xlsx)",
        type=['xlsx'],
        help="Upload your biometric attendance Excel export"
    )
    
    if uploaded_file is not None:
        st.success(f"✅ File uploaded: {uploaded_file.name}")
        
        # Show file info
        file_size = len(uploaded_file.getvalue()) / 1024  # KB
        st.info(f"📏 File size: {file_size:.2f} KB")

with col2:
    st.subheader("📅 Processing Details")
    month_name = datetime(year, month, 1).strftime("%B")
    st.write(f"**Period:** {month_name} {year}")
    st.write(f"**Standard Hours:** {max_hours} hours/day")
    st.write(f"**Auto-assignment:** Missing punch-outs will be assigned {max_hours} hours")

# Process button
if uploaded_file is not None:
    st.markdown("---")
    
    if st.button("🚀 Process Attendance File", type="primary", use_container_width=True):
        with st.spinner("Processing attendance data... Please wait..."):
            try:
                # Save uploaded file temporarily
                temp_input_path = f"temp_upload_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
                with open(temp_input_path, "wb") as f:
                    f.write(uploaded_file.getvalue())
                
                # Process the file
                processor = AttendanceProcessor(max_hours_per_day=max_hours)
                
                output_filename = f"Attendance_Report_{month_name}_{year}.xlsx"
                output_path = os.path.join(os.getcwd(), output_filename)
                
                daily_report, monthly_summary = processor.process(
                    input_file=temp_input_path,
                    output_file=output_path,
                    year=year,
                    month=month,
                    max_hours=max_hours
                )
                
                # Clean up temp file
                os.remove(temp_input_path)
                
                # Display success message
                st.success("✅ Processing completed successfully!")
                
                # Display summary metrics
                st.markdown("### 📊 Processing Summary")
                
                col1, col2, col3, col4 = st.columns(4)
                with col1:
                    st.metric("Total Records", len(daily_report))
                with col2:
                    st.metric("Employees", len(monthly_summary))
                with col3:
                    st.metric("Total Hours", f"{monthly_summary['total_hours'].sum():.2f}")
                with col4:
                    st.metric("Present Days", monthly_summary['present_days'].sum())
                
                # Display monthly summary
                st.markdown("### 👥 Monthly Summary by Employee")
                
                # Format the dataframe for better display
                display_summary = monthly_summary.copy()
                display_summary['total_hours'] = display_summary['total_hours'].round(2)
                
                st.dataframe(
                    display_summary,
                    use_container_width=True,
                    height=400
                )
                
                # Display daily records sample
                st.markdown("### 📅 Daily Records (Sample - First 20 rows)")
                st.dataframe(
                    daily_report.head(20),
                    use_container_width=True,
                    height=400
                )
                
                # Download button for the output file
                st.markdown("### 💾 Download Report")
                
                with open(output_path, "rb") as f:
                    excel_data = f.read()
                
                st.download_button(
                    label="📥 Download Excel Report",
                    data=excel_data,
                    file_name=output_filename,
                    mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    type="primary",
                    use_container_width=True
                )
                
                # Additional statistics
                st.markdown("### 📈 Additional Statistics")
                col1, col2, col3 = st.columns(3)
                
                with col1:
                    st.write("**Attendance Status**")
                    st.write(f"- Total Absent Days: {monthly_summary['absent_days'].sum()}")
                    st.write(f"- Auto-Assigned Cases: {monthly_summary['auto_assigned_days'].sum()}")
                
                with col2:
                    st.write("**Average Metrics**")
                    avg_hours = monthly_summary['total_hours'].mean()
                    avg_present = monthly_summary['present_days'].mean()
                    st.write(f"- Avg Hours/Employee: {avg_hours:.2f}")
                    st.write(f"- Avg Present Days: {avg_present:.2f}")
                
                with col3:
                    st.write("**Top Performer**")
                    top_employee = monthly_summary.loc[monthly_summary['total_hours'].idxmax()]
                    st.write(f"- {top_employee['employee_name']}")
                    st.write(f"- {top_employee['total_hours']:.2f} hours")
                
            except Exception as e:
                st.error(f"❌ Error processing file: {str(e)}")
                st.exception(e)
                
                # Clean up temp file if it exists
                if os.path.exists(temp_input_path):
                    os.remove(temp_input_path)

else:
    # Instructions when no file is uploaded
    st.markdown("---")
    st.info("👆 Please upload an Excel file to begin processing")
    
    with st.expander("📋 Expected File Format"):
        st.markdown("""
        Your Excel file should have the following structure:
        
        **Row 1:** "Attendance Record Report"  
        **Row 2:** "Att. Time"  
        **Row 3:** "Date Range: YYYY-MM-DD ~ YYYY-MM-DD"  
        **Row 4:** Column headers (Employee ID, Employee Name, 1, 2, 3... 31)  
        **Row 5+:** Employee attendance data
        
        **Time Format:** HH:MM (24-hour format)
        
        **Examples:**
        - Normal day: `09:35 18:10`
        - Multiple punches: `09:10 13:00 14:00 18:30`
        - Single punch: `10:05`
        - Absent: (leave blank)
        """)
    
    with st.expander("🔧 Business Logic"):
        st.markdown("""
        | Scenario | Timestamps | Action | Status |
        |----------|-----------|--------|--------|
        | **Normal** | 2 punches | Calculate hours between IN-OUT | Present |
        | **Missing OUT** | 1 punch | Auto-assign configured hours | Missing Punch-Out |
        | **Multiple (Even)** | 4, 6, 8... | Pair sequentially and sum | Present |
        | **Multiple (Odd)** | 3, 5, 7... | Auto-assign configured hours | Punch Error |
        | **Absent** | 0 punches | Mark as absent | Absent |
        """)

# Footer
st.markdown("---")
st.markdown(
    """
    <div style='text-align: center; color: #666; padding: 1rem;'>
    <p>Attendance Processing System v1.0 | Built with ❤️ using Streamlit</p>
    </div>
    """,
    unsafe_allow_html=True
)
