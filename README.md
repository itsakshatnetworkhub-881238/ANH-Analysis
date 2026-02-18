# 📊 ANH-Analysis
### Akshat Network Hub User Analysis Report

ANH-Analysis is a **Client-Side Governance & Analytics Engine** built under the ecosystem of Akshat Network Hub.

It provides:

- 🔐 Authentication System (Age 12+ Validation)
- 🔑 Custom ANH Hash Password Algorithm
- ⏳ 30-Minute Session Control
- 🚦 Guest Access Restriction (3 pages/day)
- 📊 IndexedDB Analytics Storage
- 🔗 Permission-Based Scripto Algorithm
- 📈 Dynamic Dashboard + Charts
- 🛡 Fully Client-Side (No Backend / No Cloud)

---

## 🌐 Live Deployment

https://akshat-881236.github.io/AkshatNetworkHub/ --> Main Home Page
https://itsakshatnetworkhub-881238.github.io/ANH-Analysis/ --> View Live Analytics Dashboard
https://itsakshatnetworkhub-881238.github.io/ANH-Analysis/ScriptoDocumentation.htm --> Scripto Algorithm Documentation 


---

## 📁 Repository Structure
```
ANH-Analysis/
│
├── index.htm                  → SPA Dashboard (Combined HTML + CSS + JS)
├── ScriptoDocumentation.htm   → Stylish Documentation Blog
│
├── scripto.js                 → 6-Second Metadata Permission Script
├── collector.js               → IndexedDB Analytics Handler
├── guest-limit.js             → Guest Visit Restriction Logic
├── dashboard.js               → Dashboard Rendering Module
├── charts.js                  → Chart Rendering Module
│
├── signup.htm                 → User Registration Page
├── login.htm                  → Login Page
├── recovery.htm               → Password Recovery Page
│
└── README.md
```
---

## 🧠 System Flow Architecture

Authorized Page
   ↓
Scripto.js (6s Delay)
   ↓
Collector.js
   ↓
IndexedDB (ANH_DB)
   ↓
index.htm Dashboard
   ↳ dashboard.js
   ↳ charts.js

---

## 🔐 Authentication System

### Sign Up Requirements

- Email
- Name
- Username
- DOB (Minimum Age: 12)
- Password
- Confirm Password

### Recovery Metadata (Any 3 Required)

- Father Name
- Mother Name
- Favorite Color
- Favorite Actor
- Favorite Sport
- Lucky Number

---

## 🔑 ANH Hash Algorithm (Public Overview)

1. Convert each password character into ASCII.
2. Write ASCII values inline.
3. After every 6 digits insert rotating sequence:
   anh → nah → han → nha → repeat
4. Store only the generated ANH Hash.
5. Raw password is never stored.

⚠ Internal transformation rules remain private for security.

---

## ⏳ Session Governance

- Login required.
- Session expires after 30 minutes.
- Expired session → Redirect to login.

---

## 🚦 Guest Access Restriction

If not logged in:

- Maximum 3 pages per day.
- Exceed limit → Forced login required.

---

## 🔗 Scripto Activation

To enable analytics on a page:

```html
<script>
const url_Id = "UNIQUE_PAGE_ID";
</script>
<script src="https://akshat-881236.github.io/ANH-Analysis/scripto.js"></script>
```

#### After 6 seconds:
```
URL captured -->  Title extracted --> Description extracted --> Logo detected --> Stored in IndexedDB
```
---
## 📊 Dashboard Features
<ul>
  <li>Total Users</li> <li>Total Visits</li> <li>Most Visited Page</li> <li>User Activity Table</li> <li>Dynamic Charts</li> <li>Logout Control</li> <li>JSON Export Ready</li> <li>Clear Database Option</li>
</ul>

---

## 🛡 Privacy Model
ANH-Analysis:
 <ul>
   <li>Does NOT send data to servers</li>
   <li>Does NOT use third-party trackers</li>
   <li>Does NOT store raw passwords</li>
   <li>Operates entirely inside browser</li>
   <li>Works only via permission script</li>
 </ul>
 
---

 ## 📚 Documentation
 Full system explanation available at:

ScriptoDocumentation.htm

Includes:
<ul>
  <li>Scripto Algorithm</li>
  <li>ANH Hash Concept</li>
  <li>Governance Model</li>
  <li>Security Structure</li>
  <li>Expansion Roadmap</li>
</ul>

---

## 🚀 Future Expansion
Planned upgrades :-
<ul>
  <li>Encrypted IndexedDB Layer</li>
  <li>Multi-role Access (Admin/User)</li>
  <li>Network-wide Monitoring</li>
  <li>Token-based Scripto v2</li>
  <li>PWA Support</li>
  <li>Advanced Analytics Engine</li>
</ul>

---
```
© 2026 Akshat Network Hub
```
Client-Side Governance System :-

---
