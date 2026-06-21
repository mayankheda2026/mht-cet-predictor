"""Region, district and branch-group normalization helpers."""
import re

# MHT-CET DTE region encoded in the first two digits of the college code.
REGION_BY_PREFIX = {
    "01": "Amravati", "02": "Chh. Sambhajinagar", "03": "Mumbai",
    "04": "Nagpur", "05": "Nashik", "06": "Pune",
    "14": "Nagpur", "16": "Pune",
}

# City -> district (covers the common campus cities; falls back to the city name).
CITY_DISTRICT = {
    "Mumbai": "Mumbai", "Matunga": "Mumbai", "Navi Mumbai": "Thane", "Panvel": "Raigad",
    "Powai": "Mumbai", "Bandra": "Mumbai", "Andheri": "Mumbai", "Vile Parle": "Mumbai",
    "Thane": "Thane", "Kalyan": "Thane", "Dombivli": "Thane", "Bhiwandi": "Thane",
    "Pune": "Pune", "Pimpri": "Pune", "Chinchwad": "Pune", "Wagholi": "Pune",
    "Lonavala": "Pune", "Avasari": "Pune", "Baramati": "Pune", "Lavale": "Pune",
    "Nagpur": "Nagpur", "Wardha": "Wardha", "Chandrapur": "Chandrapur", "Gondia": "Gondia",
    "Amravati": "Amravati", "Akola": "Akola", "Buldhana": "Buldhana", "Shegaon": "Buldhana",
    "Yavatmal": "Yavatmal", "Washim": "Washim",
    "Nashik": "Nashik", "Jalgaon": "Jalgaon", "Dhule": "Dhule", "Nandurbar": "Nandurbar",
    "Aurangabad": "Chh. Sambhajinagar", "Chhatrapati Sambhaji": "Chh. Sambhajinagar",
    "Nanded": "Nanded", "Latur": "Latur", "Jalna": "Jalna", "Beed": "Beed",
    "Solapur": "Solapur", "Kolhapur": "Kolhapur", "Sangli": "Sangli", "Satara": "Satara",
    "Ahmednagar": "Ahmednagar", "Ratnagiri": "Ratnagiri", "Sindhudurg": "Sindhudurg",
}


def clean_college_name(name):
    if not name:
        return name
    return re.sub(r"\s+", " ", name).strip().rstrip(",")


def region_for_college(code, name):
    region = REGION_BY_PREFIX.get((code or "")[:2], "Maharashtra")
    district = None
    if name and "," in name:
        tail = name.split(",")[-1].strip()
        for city, dist in CITY_DISTRICT.items():
            if city.lower() in tail.lower():
                district = dist
                break
        if not district:
            district = tail
    if not district:
        for city, dist in CITY_DISTRICT.items():
            if name and city.lower() in name.lower():
                district = dist
                break
    return region, district or region


# Branch grouping ------------------------------------------------------------
BRANCH_GROUPS = [
    ("AI & Data Science", [
        "artificial intelligence", "data science", "machine learning", "a.i", "(ai)", " ai ",
        "data analytics"]),
    ("Computer & IT", [
        "computer", "information technology", "cyber", "internet of things", " iot",
        "software", "computation"]),
    ("Electronics & Telecom", [
        "electronics", "telecommunication", "communication", "vlsi", "embedded",
        "e&tc", "entc"]),
    ("Electrical", ["electrical", "power", "energy"]),
    ("Mechanical & Allied", [
        "mechanical", "automobile", "automotive", "mechatronics", "automation",
        "robotics", "manufacturing", "production", "thermal", "tool"]),
    ("Civil & Structural", ["civil", "structural", "construction", "environmental engineering"]),
    ("Chemical & Process", [
        "chemical", "petro", "polymer", "plastic", "paint", "oil", "surface coating",
        "pharmaceutical", "process"]),
    ("Instrumentation", ["instrumentation", "control"]),
    ("Bio & Food", ["bio", "food", "textile", "fashion", "agri", "dairy"]),
    ("Aerospace & Marine", ["aeronautic", "aerospace", "avionics", "marine", "naval", "metallurg", "mining"]),
]


def branch_group_for(name):
    low = (name or "").lower()
    # AI/DS should win over generic "computer" when both appear
    for group, kws in BRANCH_GROUPS:
        for kw in kws:
            if kw in low:
                return group
    return "Other Engineering"
