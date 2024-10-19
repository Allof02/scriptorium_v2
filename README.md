## APIs:

/auth/login: Login handler with JWT and  simple validation.

/ auth/signup: Signup handler with hashed password and simple validation.

/users/:id: Search and Update user profiles. All users and visitors (non-registered users) can search other users; Update profile is restricted to ADMIN and the profile owner (users can only update their own profiles)

/templates/index: 1. Create a new code template; 2. Search for multiple code templates based on input title, description, code, language, and tags

/templates/:id : Search, update, delete codetemplates.



/lib/authmiddleware: a handler checking tokens

