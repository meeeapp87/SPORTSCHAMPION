import json

src = r'C:\Users\M\Desktop\github for local\sports\frontend\src\data\schools_names.json'

with open(src, encoding='utf-8') as f:
    schools = json.load(f)

def get_gender(s):
    en = s['english']
    ar = s['arabic']
    if 'Boys' in en or 'بنين' in ar:
        return 'بنين'
    elif 'Girls' in en or 'بنات' in ar:
        return 'بنات'
    else:
        return 'مشترك'

for s in schools:
    s['gender'] = get_gender(s)

boys = [s for s in schools if s['gender'] == 'بنين']
girls = [s for s in schools if s['gender'] == 'بنات']
mixed = [s for s in schools if s['gender'] == 'مشترك']
print(f'Boys: {len(boys)}, Girls: {len(girls)}, Mixed: {len(mixed)}')
print('Sample mixed:', mixed[0]['english'] if mixed else '')

with open(src, 'w', encoding='utf-8') as f:
    json.dump(schools, f, ensure_ascii=False, indent=2)

print('Done')
