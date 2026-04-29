import json, re

src = r'C:\Users\M\Desktop\github for local\sports\schools_names_only.json'
dst1 = r'C:\Users\M\Desktop\github for local\sports\frontend\src\data\schools_names.json'
dst2 = r'C:\Users\M\Desktop\github for local\sports\schools_names_only.json'

with open(src, 'rb') as f:
    content = f.read()

schools = json.loads(content)

def fix(s):
    try:
        return s.encode('cp1252').decode('utf-8')
    except:
        return s

def clean_ar(s):
    s = fix(s)
    s = re.sub(r'\s*المستقلة\s*', ' ', s)
    s = re.sub(r'\s+', ' ', s)
    return s.strip(' -')

def clean_en(s):
    s = s.replace(' Independent', '').strip()
    s = re.sub(r'\s+', ' ', s)
    return s

cleaned = []
for s in schools:
    en = clean_en(s['english'])
    ar = clean_ar(s['arabic'])
    label = en + ' / ' + ar
    cleaned.append({'english': en, 'arabic': ar, 'label': label})

for path in [dst1, dst2]:
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(cleaned, f, ensure_ascii=False, indent=2)

print('Done:', len(cleaned), 'schools')
for s in cleaned[:5]:
    print('EN:', s['english'])
    print('AR:', s['arabic'])
    print()
