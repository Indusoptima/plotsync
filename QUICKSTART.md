# 🚀 Multi-Stage Floor Plan Generator - Quick Start

## ⚡ Get Started in 3 Minutes

### 1️⃣ Set Up Environment

```bash
# Add your OpenRouter API key
echo "OPENROUTER_API_KEY=sk-or-v1-..." >> .env.local
echo "NEXT_PUBLIC_APP_URL=http://localhost:3000" >> .env.local
```

### 2️⃣ Start the Server

```bash
npm run dev
```

### 3️⃣ Test the API

```bash
curl -X POST http://localhost:3000/api/generate-floor-plan-v2 \
  -H "Content-Type: application/json" \
  -d '{
    "userInput": "2 bedroom apartment, 80 square meters",
    "parameters": {
      "totalArea": 80,
      "unit": "metric",
      "floors": 1,
      "rooms": {
        "bedroom": 2,
        "bathroom": 1,
        "kitchen": 1,
        "livingRoom": 1
      }
    },
    "variationCount": 5
  }'
```

## ✅ What You Get

```json
{
  "variations": [
    {
      "id": "variation_1",
      "geometry": {
        "rooms": [/* Complete room geometries */],
        "walls": [/* All walls with doors/windows */],
        "openings": [/* Doors and windows */]
      },
      "preview": {
        "svg": "<svg>...</svg>",  // Editable floor plan
        "thumbnail": "data:..."     // Preview image
      },
      "metadata": {
        "confidence": 95,           // Quality score
        "generationTime": 2500      // milliseconds
      }
    }
    // ... 4 more variations
  ]
}
```

## 📝 Example Requests

### Simple Apartment
```json
{
  "userInput": "1 bedroom studio, 40 sqm",
  "parameters": {
    "unit": "metric",
    "floors": 1,
    "rooms": {"bedroom": 1, "bathroom": 1, "kitchen": 1}
  },
  "variationCount": 5
}
```

### Family House
```json
{
  "userInput": "3 bedroom house with open kitchen and garden access",
  "parameters": {
    "totalArea": 120,
    "unit": "metric",
    "floors": 1,
    "rooms": {
      "bedroom": 3,
      "bathroom": 2,
      "kitchen": 1,
      "livingRoom": 1,
      "diningRoom": 1
    },
    "style": "modern",
    "preferences": {
      "openPlan": true,
      "gardenAccess": true
    }
  },
  "variationCount": 3
}
```

### Luxury Villa
```json
{
  "userInput": "4 bedroom villa with master ensuite and study",
  "parameters": {
    "totalArea": 200,
    "unit": "metric",
    "floors": 1,
    "rooms": {
      "bedroom": 4,
      "bathroom": 3,
      "kitchen": 1,
      "livingRoom": 1,
      "diningRoom": 1,
      "study": 1
    },
    "style": "modern",
    "preferences": {
      "ensuites": true
    }
  },
  "variationCount": 5
}
```

## 🎨 Using the SVG Output

### Save to File
```javascript
const response = await fetch('/api/generate-floor-plan-v2', {...});
const data = await response.json();
const svg = data.variations[0].preview.svg;

// Save to file
const fs = require('fs');
fs.writeFileSync('floor-plan.svg', svg);
```

### Display in HTML
```html
<div id="floor-plan"></div>

<script>
  const svg = /* SVG from API */;
  document.getElementById('floor-plan').innerHTML = svg;
</script>
```

### Open in Figma/Illustrator
1. Save SVG to file
2. Import into design tool
3. Edit layers (walls, rooms, labels)

## 🛠️ Customization Options

### Room Types
- `bedroom`
- `bathroom`
- `kitchen`
- `livingRoom`
- `diningRoom`
- `study`
- `utility`
- `garage`
- `balcony`
- `hallway`

### Styles
- `modern`
- `traditional`
- `minimalist`
- `industrial`

### Preferences
- `openPlan`: Combine kitchen/living/dining
- `ensuites`: Bathrooms connected to bedrooms
- `gardenAccess`: Door to outdoor space

## 📊 Understanding the Response

### Confidence Score
- **90-100**: Excellent - all constraints met
- **80-89**: Good - minor relaxations
- **70-79**: Fair - some constraints relaxed
- **< 70**: Poor - significant issues

### Relaxed Constraints
List of warnings about what couldn't be perfectly achieved:
```json
"relaxedConstraints": [
  "Could not optimally place bedroom3",
  "Room areas very tight"
]
```

### Geometry Structure
```javascript
{
  rooms: [
    {
      id: "bedroom1",
      type: "bedroom",
      geometry: {
        vertices: [{x, y}, ...],  // Polygon points
        centroid: {x, y},          // Center point
        area: 14.5,                // Square meters
        bounds: {x, y, width, height}
      },
      labels: {
        name: "Bedroom",
        area: "14.5 m²",
        dimensions: "4.00 × 3.50 m"
      }
    }
  ],
  walls: [
    {
      id: "wall_ext_...",
      type: "exterior",          // or "interior"
      thickness: 0.15,           // meters
      geometry: {start: {x,y}, end: {x,y}},
      adjacentRooms: ["bedroom1"]
    }
  ],
  openings: [
    {
      id: "door_...",
      type: "door",              // or "window"
      width: 0.9,
      wallId: "wall_...",
      position: 0.5,             // 0-1 along wall
      properties: {
        swingDirection: 90,      // degrees
        isEntry: false
      }
    }
  ]
}
```

## ⚠️ Troubleshooting

### "OpenRouter API key not configured"
→ Add `OPENROUTER_API_KEY` to `.env.local` and restart server

### "Could not find valid room placement"
→ Total area too small. Increase `totalArea` or reduce room count

### No variations returned
→ Check `errors` in response:
```javascript
const data = await response.json();
console.log(data.errors);
```

### Low confidence scores
→ Constraints too tight. Try:
- Increase total area
- Reduce room count
- Remove strict preferences

## 📚 Documentation

- **Full Guide**: [MULTI_STAGE_FLOOR_PLAN_SYSTEM.md](./MULTI_STAGE_FLOOR_PLAN_SYSTEM.md)
- **Implementation Details**: [IMPLEMENTATION_COMPLETE.md](./IMPLEMENTATION_COMPLETE.md)
- **Progress Tracking**: [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md)

## 🎯 Next Steps

1. **Test with your own inputs**
2. **Export SVGs to design tools**
3. **Integrate into your app**
4. **Customize the SVG styling**
5. **Build frontend components**

## 💡 Tips

- Start with simple 2-3 room layouts to test
- Use natural language in `userInput` for better results
- Request 3-5 variations to get diverse options
- Check `confidence` scores to pick best variation
- Review `relaxedConstraints` to understand tradeoffs

---

**Ready to generate floor plans! 🏗️**
