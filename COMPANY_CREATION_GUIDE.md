# Manual Company Creation Guide

## Overview

You can now manually create companies directly from the SuperAdmin dashboard without any email verification. This is perfect for your soft launch with 20 companies.

## How to Create a Company

### Method 1: From the Overview Tab (Recommended)
1. **Login to SuperAdmin Dashboard**
   - Go to `http://localhost:5173/super-admin`
   - Login with: `superadmin` / `password`

2. **Navigate to Overview Tab**
   - The Overview tab is the default landing page
   - Look for the "Quick Actions" section at the top

3. **Click "Create New Company"**
   - Click the primary blue button in the Quick Actions section
   - Or click the "Add Company" button in the Quick Actions grid

### Method 2: From Account Management Tab
1. **Go to Account Management**
   - Click "Account Management" in the sidebar
   - Look for the "Create New Company" button in the top-right of the card

### Method 3: From Pending Registrations Tab
1. **Go to Pending Registrations**
   - Click "Pending Registrations" in the sidebar
   - Select the "Companies" tab
   - Click "Create New Company" button in the top-right

## Company Creation Form

Fill out the following fields:

### Required Fields:
- **Company Name**: The official company name (e.g., "TechCorp Solutions")
- **Company Email**: Primary contact email for the company
- **Admin Username**: Username for the admin account (e.g., "admin")
- **Admin Password**: Password for the admin account (minimum 8 characters)

### Optional Fields:
- **Display Name**: A friendly display name (if different from company name)
- **Admin Email**: Admin's personal email (uses company email if empty)

## Example Company Creation

Here's an example for creating your first test company:

```
Company Name: TechCorp Solutions
Display Name: TechCorp
Company Email: admin@techcorp.com
Admin Username: admin
Admin Password: SecurePass123!
Admin Email: admin@techcorp.com
```

## What Happens After Creation

1. **Company is Created**: The company is immediately created with `status: 'approved'`
2. **Admin Account Created**: An admin user account is created for the company
3. **Login Credentials**: You'll see the login credentials in the response
4. **Widget Ready**: The company can immediately generate and use their widget

## Login Information

After creating a company, you'll receive:
- **Company UUID**: Unique identifier for the company
- **Admin Username**: Username for admin login
- **Admin Password**: Password for admin login
- **Login URL**: Direct link to login with pre-filled credentials

## Testing the Created Company

1. **Login as Company Admin**
   - Use the provided login credentials
   - Go to the company admin dashboard

2. **Generate Widget**
   - Go to the Widget tab
   - Customize the widget settings
   - Copy the generated widget code

3. **Test Widget**
   - Embed the widget on a test page
   - Test call routing and functionality

## For Your Soft Launch

Create 20 companies using this method:

### Sample Company Names:
1. TechCorp Solutions
2. Digital Marketing Pro
3. E-commerce Express
4. Healthcare Connect
5. Financial Services Plus
6. Education Hub
7. Real Estate Pro
8. Legal Services
9. Consulting Group
10. Retail Solutions
11. Manufacturing Hub
12. Logistics Pro
13. Hospitality Services
14. Automotive Solutions
15. Construction Pro
16. Insurance Services
17. Travel Agency
18. Fitness Center
19. Beauty Salon
20. Restaurant Group

### Quick Creation Tips:
- Use consistent admin usernames (e.g., "admin" for all)
- Use strong passwords (e.g., "CompanyName123!")
- Use company-specific email domains when possible
- Keep track of login credentials in a spreadsheet

## Troubleshooting

### If Company Creation Fails:
1. **Check Backend**: Ensure the backend server is running on port 5001
2. **Check Network**: Verify the API call is reaching the backend
3. **Check Logs**: Look at browser console and backend logs for errors
4. **Try Again**: Sometimes network issues can cause failures

### If Login Doesn't Work:
1. **Verify Credentials**: Double-check username and password
2. **Check Company Status**: Ensure company status is 'approved'
3. **Clear Browser Cache**: Try clearing browser cache and cookies
4. **Check Backend**: Ensure backend is running and accessible

## Next Steps After Company Creation

1. **Create Agents**: Add agents to the company via the company admin dashboard
2. **Customize Widget**: Set up widget appearance and settings
3. **Test Functionality**: Test call routing and chat functionality
4. **Deploy Widget**: Embed widget on the company's website
5. **Monitor Performance**: Track calls and agent activity

This manual company creation system gives you full control over your soft launch and allows you to quickly set up 20 companies for testing without any email verification delays. 