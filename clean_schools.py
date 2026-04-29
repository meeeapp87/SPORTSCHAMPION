import json, re

src = r'C:\Users\M\Desktop\github for local\sports\schools_names_only.json'
dst1 = r'C:\Users\M\Desktop\github for local\sports\frontend\src\data\schools_names.json'
dst2 = r'C:\Users\M\Desktop\github for local\sports\schools_names_only.json'

with open(src, encoding='utf-8-sig') as f:
    schools = json.load(f)

def clean_ar(s):
    s = re.sub(r'\s*المستقلة\s*', ' ', s)
    s = re.sub(r'\s+', ' ', s)
    return s.strip(' -')

cleaned = []
for s in schools:
    en = s['english'].replace(' Independent', '').strip()
    ar = clean_ar(s['arabic'])
    label = en + ' / ' + ar
    cleaned.append({'english': en, 'arabic': ar, 'label': label})

for path in [dst1, dst2]:
    with open(path, 'w', encoding='utf-8', newline='\n') as f:
        json.dump(cleaned, f, ensure_ascii=True, indent=2)

print('Done:', len(cleaned), 'schools')
for s in cleaned[:5]:
    print('EN:', s['english'])
    print('AR:', s['arabic'])
    print('Label:', s['label'])
    print()
