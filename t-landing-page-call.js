[33mcommit 5a507bc8c0ecc15ff1f9822a9321ad60df2fa49f[m[33m ([m[1;36mHEAD[m[33m -> [m[1;32mmain[m[33m)[m
Author: kimundume <your-email@example.com>
Date:   Sat Aug 2 22:36:32 2025 +0300

    Fix IVRChatWidget companyUuid issue - add fallback and force re-render

 backend/dist/routes/widget.js            | 27 [32m+++++++++++++++[m
 backend/src/routes/widget.ts             | 33 [32m+++++++++++++++++++[m
 frontend/dashboard/src/IVRChatWidget.tsx | 56 [32m+++++++++++++++++[m[31m---------------[m
 frontend/dashboard/src/LandingPage.tsx   |  6 [32m++[m[31m--[m
 4 files changed, 93 insertions(+), 29 deletions(-)
