#!/bin/bash

echo "🧪 Testing FamilyScreen AI Backend..."
echo ""

echo "1️⃣ Testing health endpoint..."
curl -s http://127.0.0.1:8000/health | python3 -m json.tool
echo ""
echo ""

echo "2️⃣ Testing analyze-family-history endpoint..."
curl -m 10 -X POST 'http://127.0.0.1:8000/analyze-family-history?patient_name=TestUser' \
  -H 'Content-Type: application/json' \
  -d '{
    "patient_info": {
      "age": 30,
      "sex": "female",
      "ethnicity": null,
      "personal_cancer_history": false
    },
    "family_members": [
      {
        "name": "Mother with breast cancer",
        "relationship": "parent",
        "cancer_type": "breast",
        "age_at_diagnosis": 45,
        "current_age": 65,
        "is_alive": true
      }
    ]
  }' 2>&1

echo ""
echo ""
echo "✅ Test complete!"
