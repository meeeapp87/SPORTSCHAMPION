import requests
import sys
from datetime import datetime

class RoleBasedAPITester:
    def __init__(self, base_url="https://fitness-registration-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.admin_session = requests.Session()
        self.school_session = requests.Session()
        self.trainer_session = requests.Session()

    def run_test(self, name, method, endpoint, expected_status, data=None, session=None):
        """Run a single API test"""
        if session is None:
            session = self.admin_session
            
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = session.get(url, headers=headers)
            elif method == 'POST':
                response = session.post(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = session.delete(url, headers=headers)

            print(f"   Status: {response.status_code}")
            success = response.status_code == expected_status
            
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {response_data}")
                    return success, response_data
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_admin_login(self):
        """Test admin login"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "api/auth/login",
            200,
            data={"email": "admin@admin.com", "password": "admin123"},
            session=self.admin_session
        )
        if success and 'role' in response:
            print(f"   Admin role: {response.get('role')}")
            return response.get('role') == 'admin'
        return False

    def test_school_user_login(self):
        """Test school user login"""
        success, response = self.run_test(
            "School User Login",
            "POST",
            "api/auth/login",
            200,
            data={"email": "doha@school.com", "password": "school123"},
            session=self.school_session
        )
        if success and 'role' in response:
            print(f"   School user role: {response.get('role')}")
            print(f"   School user school_id: {response.get('school_id')}")
            print(f"   School user school_name: {response.get('school_name')}")
            return response.get('role') == 'school_user' and response.get('school_name') == 'مدرسة الدوحة الثانوية'
        return False

    def test_trainer_login(self):
        """Test trainer login"""
        success, response = self.run_test(
            "Trainer Login",
            "POST",
            "api/auth/login",
            200,
            data={"email": "trainer@fitness.com", "password": "trainer123"},
            session=self.trainer_session
        )
        if success and 'role' in response:
            print(f"   Trainer role: {response.get('role')}")
            return response.get('role') == 'trainer'
        return False

    def test_admin_me_endpoint(self):
        """Test /me endpoint for admin"""
        success, response = self.run_test(
            "Admin /me endpoint",
            "GET",
            "api/auth/me",
            200,
            session=self.admin_session
        )
        if success:
            return response.get('role') == 'admin'
        return False

    def test_school_user_me_endpoint(self):
        """Test /me endpoint for school user"""
        success, response = self.run_test(
            "School User /me endpoint",
            "GET",
            "api/auth/me",
            200,
            session=self.school_session
        )
        if success:
            return response.get('role') == 'school_user' and response.get('school_name') == 'مدرسة الدوحة الثانوية'
        return False

    def test_trainer_me_endpoint(self):
        """Test /me endpoint for trainer"""
        success, response = self.run_test(
            "Trainer /me endpoint",
            "GET",
            "api/auth/me",
            200,
            session=self.trainer_session
        )
        if success:
            return response.get('role') == 'trainer'
        return False

    def test_admin_list_users(self):
        """Test admin can list users"""
        success, response = self.run_test(
            "Admin List Users",
            "GET",
            "api/admin/users",
            200,
            session=self.admin_session
        )
        if success and isinstance(response, list):
            print(f"   Found {len(response)} users")
            # Check if we have the expected users
            emails = [user.get('email') for user in response]
            expected_emails = ['admin@admin.com', 'doha@school.com', 'trainer@fitness.com']
            found_emails = [email for email in expected_emails if email in emails]
            print(f"   Expected users found: {found_emails}")
            return len(found_emails) >= 3
        return False

    def test_school_user_cannot_list_users(self):
        """Test school user cannot access admin endpoints"""
        success, response = self.run_test(
            "School User Cannot List Users",
            "GET",
            "api/admin/users",
            403,
            session=self.school_session
        )
        return success

    def test_trainer_cannot_list_users(self):
        """Test trainer cannot access admin endpoints"""
        success, response = self.run_test(
            "Trainer Cannot List Users",
            "GET",
            "api/admin/users",
            403,
            session=self.trainer_session
        )
        return success

    def test_admin_create_user(self):
        """Test admin can create new users"""
        timestamp = datetime.now().strftime('%H%M%S')
        success, response = self.run_test(
            "Admin Create User",
            "POST",
            "api/admin/users",
            200,
            data={
                "email": f"test_{timestamp}@test.com",
                "password": "testpass123",
                "name": f"Test User {timestamp}",
                "role": "viewer"
            },
            session=self.admin_session
        )
        if success and 'role' in response:
            return response.get('role') == 'viewer'
        return False

    def test_logout_all_sessions(self):
        """Test logout for all sessions"""
        results = []
        
        # Test admin logout
        success, _ = self.run_test(
            "Admin Logout",
            "POST",
            "api/auth/logout",
            200,
            session=self.admin_session
        )
        results.append(success)
        
        # Test school user logout
        success, _ = self.run_test(
            "School User Logout",
            "POST",
            "api/auth/logout",
            200,
            session=self.school_session
        )
        results.append(success)
        
        # Test trainer logout
        success, _ = self.run_test(
            "Trainer Logout",
            "POST",
            "api/auth/logout",
            200,
            session=self.trainer_session
        )
        results.append(success)
        
        return all(results)

def main():
    print("🚀 Starting Role-Based Authentication API Tests")
    print("=" * 70)
    
    tester = RoleBasedAPITester()
    
    # Test sequence for role-based authentication
    tests = [
        ("Admin Login", tester.test_admin_login),
        ("School User Login", tester.test_school_user_login),
        ("Trainer Login", tester.test_trainer_login),
        ("Admin /me Endpoint", tester.test_admin_me_endpoint),
        ("School User /me Endpoint", tester.test_school_user_me_endpoint),
        ("Trainer /me Endpoint", tester.test_trainer_me_endpoint),
        ("Admin Can List Users", tester.test_admin_list_users),
        ("School User Cannot List Users", tester.test_school_user_cannot_list_users),
        ("Trainer Cannot List Users", tester.test_trainer_cannot_list_users),
        ("Admin Can Create User", tester.test_admin_create_user),
        ("Logout All Sessions", tester.test_logout_all_sessions),
    ]
    
    failed_tests = []
    
    for test_name, test_func in tests:
        try:
            result = test_func()
            if not result:
                failed_tests.append(test_name)
        except Exception as e:
            print(f"❌ {test_name} - Exception: {str(e)}")
            failed_tests.append(test_name)
    
    # Print summary
    print("\n" + "=" * 70)
    print(f"📊 Test Results Summary:")
    print(f"   Tests Run: {tester.tests_run}")
    print(f"   Tests Passed: {tester.tests_passed}")
    print(f"   Tests Failed: {len(failed_tests)}")
    print(f"   Success Rate: {(tester.tests_passed/tester.tests_run*100):.1f}%")
    
    if failed_tests:
        print(f"\n❌ Failed Tests:")
        for test in failed_tests:
            print(f"   - {test}")
    else:
        print(f"\n✅ All tests passed!")
    
    return 0 if len(failed_tests) == 0 else 1

if __name__ == "__main__":
    sys.exit(main())