# نظام إدارة تسجيل الطلاب - مشروع اللياقة البدنية والصحة

## Original Problem Statement
Arabic RTL Student Registration Management System for a fitness and health project across schools. Max 3 students per school, auto BMI calculation, physical test results, Convex backend.

## Architecture
- **Database**: Convex (https://fiery-bullfrog-978.convex.cloud) for all application data
- **Auth**: FastAPI + MongoDB (JWT-based login/register)
- **Frontend**: React (CRA) with Convex React client, Shadcn UI, TailwindCSS
- **Design**: Qatar flag colors (Maroon #8A1538, Gold #D4AF37), Arabic RTL

## Convex Schema
- schools: name, stage, grades, allowedBirthYears, maxStudents, isActive
- students: schoolId, fullName, stage, grade, birthYear, personalId, height, weight, bmi, nationality, test scores
- settings: key-value pairs for system configuration

## What's Implemented (April 13, 2026)
- [x] JWT Auth (login, register, logout) with admin seeding
- [x] Dashboard with statistics (schools, students, capacity status)
- [x] Student Registration Form with BMI auto-calculation
- [x] Student List with search, filters, pagination, export (Excel/CSV)
- [x] Student Detail Page with test results
- [x] School Detail Page with capacity tracking
- [x] Admin Panel (school management, system settings)
- [x] Convex deployment with schema + functions
- [x] Seed data (3 test schools for 3 academic stages)
- [x] Max 3 students per school enforcement
- [x] RTL Arabic layout with responsive design
- [x] Qatar flag colors (maroon/gold) theme
- [x] Mobile-first responsive design

## User Personas
1. **مدير النظام (Admin)**: Full CRUD, manage schools/settings/users
2. **مستخدم المدرسة (School User)**: Add/edit students for their school only
3. **مستخدم عرض (Viewer)**: Read-only access

## Prioritized Backlog
### P0 (Done)
- Core registration, dashboard, admin panel

### P1 (Next)
- School user role enforcement (restrict to own school)
- Duplicate birth year per school validation
- Print student data/reports
- Password reset flow

### P2 (Later)
- Advanced reporting/analytics
- Image/file attachments for students
- Audit log tracking
- Workflow approvals
- Multi-language support (Arabic/English)
- PDF export

## Update: April 13, 2026 - Comparison Feature
- [x] School Comparison Page (/comparison) with interactive charts
- [x] Bar chart comparing average test scores across schools
- [x] Radar chart showing strength profiles per school
- [x] Detailed comparison table with rankings and trophies
- [x] Best school per test cards
- [x] School ranking based on aggregate performance
- [x] Navigation link added in sidebar
- [x] Quick access button from dashboard
- [x] 5 test students registered across 3 schools for demo data
