import pandas as pd

# Read the file
df = pd.read_excel(r"C:\Users\A\Desktop\Biometric\DECEMBER_2025.xlsx", sheet_name=0, header=None)

print("First 15 rows:")
for idx, row in df.head(15).iterrows():
    print(f"\nRow {idx}:")
    for col_idx, val in enumerate(row):
        if pd.notna(val):
            print(f"  Col {col_idx}: '{val}' (type: {type(val).__name__})")
