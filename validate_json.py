import json
files = [
    r'C:\Users\M\Desktop\github for local\sports\frontend\src\data\fitness_standards_primary.json',
    r'C:\Users\M\Desktop\github for local\sports\frontend\src\data\fitness_standards_middle.json',
]
for path in files:
    with open(path, encoding='utf-8') as f:
        data = json.load(f)
    print('OK:', data['stage_ar'], '| tests:', len(data['tests']))
    for t in data['tests']:
        b = len(t['mappings']['boys'])
        g = len(t['mappings']['girls'])
        print(' ', t['key'], '| boys:', b, '| girls:', g)
