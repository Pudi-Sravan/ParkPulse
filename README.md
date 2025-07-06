# 🚗 ParkPulse – Smart Parking Prediction App

## 📖 Table of Contents
- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Demo](#demo)
- [Appwrite Setup](#appwrite-setup)
- [Local Setup](#local-setup)
- [Flask Prediction Server](#flask-prediction-server)
- [Future Improvements](#future-improvements)

## 🌟 Overview
ParkPulse is a **real-time smart parking solution** developed for the Walmart Sparkathon. It provides:
- **Live parking availability**
- **Wait-time predictions** using ML
- **Future planning** for parking slots (Cars, Bikes, Physically Abled)

Designed for both **users** and **admins**, ParkPulse simplifies parking during peak hours and events.

## 🎯 Key Features

| Feature | Description |
|---------|-------------|
| 🔐 OTP Login | Secure authentication for users |
| 📍 Live Tracking | Real-time vacancy updates for 3 slot types |
| ⏱️ Wait Predictions | ML-powered estimates when slots are full |
| 📅 Trip Planner | Check future availability probabilities |
| 📊 Admin Panel | Manage slots, events, and view analytics |

## 🛠️ Tech Stack
- **Frontend**: React Native + Expo
- **Backend**: Appwrite Cloud DB
- **ML Server**: Flask (Python)
- **Styling**: Tailwind CSS (Nativewind)

## 📹 Demo
Watch the [Demo Video](https://drive.google.com/file/d/1TblDwl9gicRjzqaBoa8vXxgzsFtwGBh7/view?usp=sharing)

## 🗃️ Appwrite Setup

### Collections Structure

#### 1. `parking` Collection 
**Attributes:**
| Key | Type | Required |
|-----|------|----------|
| Slotid | String | Yes |
| Vacancy | Boolean | Yes |
| check_in | String | No |
| check_out | String | No |
| slot_type | Enum | Yes |

#### 2. `waiting` Collection 
**Attributes:**
| Key | Type | Required |
|-----|------|----------|
| slotid | String | Yes |
| wait_time | Double | No |
| check_in | String | Yes |
| check_out | String | No |
| category | Enum | Yes |

#### 3. `event` Collection 
**Attributes:**
| Key | Type | Required |
|-----|------|----------|
| event_name | String | Yes |
| event_type | Enum | Yes |
| event_date | DateTime | Yes |

## ⚙️ Local Setup

### 1. Clone Repo & Install Dependencies
```bash
git clone https://github.com/Pudi-Sravan/ParkPulse.git
cd ParkPulse
npm install
```

### 2. Configure Environment
Create `.env` with:
```env
EXPO_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
EXPO_PUBLIC_APPWRITE_DATABASE_ID=
EXPO_PUBLIC_APPWRITE_PARKING_COLLECTION_ID=
EXPO_PUBLIC_APPWRITE_WAITLOG_COLLECTION_ID=
EXPO_PUBLIC_APPWRITE_EVENT_COLLECTION_ID=
EXPO_PUBLIC_FLASK_SERVER=http://localhost:5000
```

### 3. Start Expo
```bash
npx expo start
```

## 🐍 Flask Prediction Server

For the ML prediction server setup, please refer to the dedicated repository:
[Parking Availability Predictor](https://github.com/Pudi-Sravan/Parking_avl_predictor)

To connect with the Flask server locally:
1. Visit the repository link above
2. Follow the setup instructions in that repo
3. Run the Flask server
4. Ensure port 5000 is open on your system to connect locally

### API Endpoints:
- `POST /predict_wait` – Returns wait time estimates
- `POST /predict_availability` – Future slot probability

## 🚀 Future Improvements
- Camera-based slot detection
- Google Maps integration

---

**Plan. Predict. Park.** 🚀 Powered by ParkPulse!
