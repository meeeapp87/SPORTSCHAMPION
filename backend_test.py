import requests
import sys
from datetime import datetime

class BackendAPITester:
    def __init__(self, base_url="https://fitness-registration-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.session = requests.Session()

    def run_test(self, name, method, endpoint, expected_status, data=None, cookies=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = self.session.get(url, headers=headers)
            elif method == 'POST':
                response = self.session.post(url, json=data, headers=headers)

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

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root API", "GET", "api/", 200)

    def test_login_invalid(self):
        """Test login with invalid credentials"""
        success, response = self.run_test(
            "Login Invalid Credentials",
            "POST",
            "api/auth/login",
            401,
            data={"email": "invalid@test.com", "password": "wrongpass"}
        )
        return success

    def test_login_valid(self):
        """Test login with valid admin credentials"""
        success, response = self.run_test(
            "Login Valid Admin",
            "POST",
            "api/auth/login",
            200,
            data={"email": "admin@admin.com", "password": "admin123"}
        )
        if success and 'id' in response:
            # Check if cookies are set
            cookies = self.session.cookies
            print(f"   Cookies received: {dict(cookies)}")
            return True
        return False

    def test_me_endpoint(self):
        """Test /me endpoint after login"""
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "api/auth/me",
            200
        )
        if success:
            print(f"   User data: {response}")
            return response.get('role') == 'admin'
        return False

    def test_register_new_user(self):
        """Test registering a new user"""
        timestamp = datetime.now().strftime('%H%M%S')
        test_email = f"test_user_{timestamp}@test.com"
        
        success, response = self.run_test(
            "Register New User",
            "POST",
            "api/auth/register",
            200,
            data={
                "email": test_email,
                "password": "testpass123",
                "name": f"Test User {timestamp}",
                "role": "viewer"
            }
        )
        return success

    def test_register_duplicate_email(self):
        """Test registering with duplicate email"""
        success, response = self.run_test(
            "Register Duplicate Email",
            "POST",
            "api/auth/register",
            400,
            data={
                "email": "admin@admin.com",
                "password": "testpass123",
                "name": "Duplicate Admin",
                "role": "admin"
            }
        )
        return success

    def test_logout(self):
        """Test logout endpoint"""
        success, response = self.run_test(
            "Logout",
            "POST",
            "api/auth/logout",
            200
        )
        if success:
            # Check if cookies are cleared
            cookies = self.session.cookies
            print(f"   Cookies after logout: {dict(cookies)}")
        return success

def main():
    print("🚀 Starting Backend API Tests for Arabic RTL Student Registration System")
    print("=" * 70)
    
    tester = BackendAPITester()
    
    # Test sequence
    tests = [
        ("Root API Endpoint", tester.test_root_endpoint),
        ("Login Invalid Credentials", tester.test_login_invalid),
        ("Login Valid Admin", tester.test_login_valid),
        ("Get Current User", tester.test_me_endpoint),
        ("Register New User", tester.test_register_new_user),
        ("Register Duplicate Email", tester.test_register_duplicate_email),
        ("Logout", tester.test_logout),
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