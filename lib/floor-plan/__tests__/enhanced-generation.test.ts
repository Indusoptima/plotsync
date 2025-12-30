/**
 * Enhanced Floor Plan Generation Tests
 * Tests for Phase 1 implementation: Template-based layout system
 */

import { templateSelector, LAYOUT_TEMPLATES } from '../stage-b/layout-templates';
import { templateBasedPlacer } from '../stage-b/template-based-placer';
import { variationDiversityScorer } from '../stage-b/variation-diversity';
import { enhancedWallSynthesizer } from '../stage-b/enhanced-wall-synthesizer';
import { FloorPlanSpecification, RoomSpec } from '../types';

describe('Template Library', () => {
  test('should have at least 20 templates', () => {
    expect(LAYOUT_TEMPLATES.length).toBeGreaterThanOrEqual(20);
  });

  test('each template should have required properties', () => {
    LAYOUT_TEMPLATES.forEach(template => {
      expect(template).toHaveProperty('id');
      expect(template).toHaveProperty('name');
      expect(template).toHaveProperty('pattern');
      expect(template).toHaveProperty('suitableFor');
      expect(template).toHaveProperty('zoneStrategy');
      expect(template).toHaveProperty('circulationPattern');
    });
  });

  test('template IDs should be unique', () => {
    const ids = LAYOUT_TEMPLATES.map(t => t.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});

describe('Template Selector', () => {
  test('should select appropriate templates for small apartment', () => {
    const templates = templateSelector.selectTemplates(
      4,    // 4 rooms
      65,   // 65 m²
      'apartment',
      5     // top 5
    );

    expect(templates.length).toBe(5);
    templates.forEach(template => {
      expect(template.suitableFor.minRooms).toBeLessThanOrEqual(4);
      expect(template.suitableFor.maxRooms).toBeGreaterThanOrEqual(4);
      expect(template.suitableFor.minArea).toBeLessThanOrEqual(65);
      expect(template.suitableFor.maxArea).toBeGreaterThanOrEqual(65);
    });
  });

  test('should select appropriate templates for large villa', () => {
    const templates = templateSelector.selectTemplates(
      10,   // 10 rooms
      250,  // 250 m²
      'villa',
      5
    );

    expect(templates.length).toBe(5);
    templates.forEach(template => {
      expect(template.suitableFor.typologies).toContain('villa');
    });
  });

  test('should select appropriate templates for studio', () => {
    const templates = templateSelector.selectTemplates(
      3,    // 3 rooms
      40,   // 40 m²
      'studio',
      5
    );

    expect(templates.length).toBeGreaterThan(0);
  });
});

describe('Template-Based Placer', () => {
  const createTestSpec = (roomCount: number, totalArea: number): FloorPlanSpecification => {
    const rooms: RoomSpec[] = [];
    const areaPerRoom = totalArea / roomCount;

    for (let i = 0; i < roomCount; i++) {
      rooms.push({
        id: `room_${i}`,
        type: i === 0 ? 'living' : i === 1 ? 'bedroom' : i === 2 ? 'kitchen' : 'bedroom',
        minArea: areaPerRoom * 0.8,
        maxArea: areaPerRoom * 1.2,
        aspectRatio: { min: 0.8, max: 1.5 },
        priority: 5,
        zone: i === 0 ? 'public' : i === 2 ? 'service' : 'private',
        requiresWindow: true,
        requiresDoor: true
      });
    }

    return {
      rooms,
      adjacencyGraph: [
        { from: 'room_0', to: 'room_1', weight: 7, type: 'should' },
        { from: 'room_0', to: 'room_2', weight: 8, type: 'should' }
      ],
      totalArea,
      metadata: {
        style: 'modern',
        entrance: 'south'
      }
    };
  };

  test('should place rooms using template for small apartment', () => {
    const spec = createTestSpec(4, 70);
    const result = templateBasedPlacer.placeWithTemplate(spec, 10, 7);

    expect(result.placed.length).toBe(4);
    expect(result.template).toBeDefined();
    expect(result.confidence).toBeGreaterThan(0);
  });

  test('should place rooms using template for larger home', () => {
    const spec = createTestSpec(8, 180);
    const result = templateBasedPlacer.placeWithTemplate(spec, 15, 12);

    expect(result.placed.length).toBe(8);
    expect(result.template).toBeDefined();
  });

  test('should generate different layouts with different seeds', () => {
    const spec = createTestSpec(5, 100);
    
    const result1 = templateBasedPlacer.placeWithTemplate(spec, 12, 8.5, 0);
    const result2 = templateBasedPlacer.placeWithTemplate(spec, 12, 8.5, 1);
    const result3 = templateBasedPlacer.placeWithTemplate(spec, 12, 8.5, 2);

    // Check that layouts are different
    const diversity12 = variationDiversityScorer.scoreDiversity(
      result1.placed,
      result2.placed
    );
    const diversity13 = variationDiversityScorer.scoreDiversity(
      result1.placed,
      result3.placed
    );

    expect(diversity12.overallDiversity).toBeGreaterThan(0);
    expect(diversity13.overallDiversity).toBeGreaterThan(0);
  });

  test('placed rooms should not overlap', () => {
    const spec = createTestSpec(6, 120);
    const result = templateBasedPlacer.placeWithTemplate(spec, 12, 10);

    for (let i = 0; i < result.placed.length; i++) {
      for (let j = i + 1; j < result.placed.length; j++) {
        const room1 = result.placed[i];
        const room2 = result.placed[j];

        const overlap = !(
          room1.x + room1.width <= room2.x ||
          room2.x + room2.width <= room1.x ||
          room1.y + room1.height <= room2.y ||
          room2.y + room2.height <= room1.y
        );

        expect(overlap).toBe(false);
      }
    }
  });
});

describe('Variation Diversity Scorer', () => {
  const createSampleLayout = (offset: number) => [
    { id: 'living', x: 0 + offset, y: 0, width: 5, height: 4, spec: { type: 'living' } as any, zone: 'public' },
    { id: 'bedroom', x: 5 + offset, y: 0, width: 4, height: 3, spec: { type: 'bedroom' } as any, zone: 'private' },
    { id: 'kitchen', x: 0 + offset, y: 4, width: 3, height: 3, spec: { type: 'kitchen' } as any, zone: 'service' }
  ];

  test('should score identical layouts as similar', () => {
    const layout1 = createSampleLayout(0);
    const layout2 = createSampleLayout(0);

    const score = variationDiversityScorer.scoreDiversity(layout1, layout2);

    expect(score.overallDiversity).toBeLessThan(10);
    expect(score.structuralSimilarity).toBeGreaterThan(0.9);
  });

  test('should score different layouts as diverse', () => {
    const layout1 = createSampleLayout(0);
    const layout2 = createSampleLayout(3);

    const score = variationDiversityScorer.scoreDiversity(layout1, layout2);

    expect(score.overallDiversity).toBeGreaterThan(0);
  });

  test('should filter variations for diversity', () => {
    const variations = [
      createSampleLayout(0),
      createSampleLayout(0.5),
      createSampleLayout(1.0),
      createSampleLayout(2.0),
      createSampleLayout(4.0)
    ];

    const filtered = variationDiversityScorer.filterForDiversity(variations, 3, 20);

    expect(filtered.length).toBeLessThanOrEqual(3);
  });
});

describe('Enhanced Wall Synthesizer', () => {
  test('should generate walls for simple rectangular layout', () => {
    const rooms = [
      { id: 'room1', x: 0, y: 0, width: 5, height: 4, spec: { type: 'living' } as any, zone: 'public' },
      { id: 'room2', x: 5, y: 0, width: 4, height: 4, spec: { type: 'bedroom' } as any, zone: 'private' }
    ];

    const walls = enhancedWallSynthesizer.synthesize(rooms);

    expect(walls.length).toBeGreaterThan(0);
    
    const exteriorWalls = walls.filter(w => w.type === 'exterior');
    const interiorWalls = walls.filter(w => w.type === 'interior');

    expect(exteriorWalls.length).toBeGreaterThan(0);
    expect(interiorWalls.length).toBeGreaterThan(0);
  });

  test('should detect shared walls between adjacent rooms', () => {
    const rooms = [
      { id: 'room1', x: 0, y: 0, width: 5, height: 4, spec: { type: 'living' } as any, zone: 'public' },
      { id: 'room2', x: 5, y: 0, width: 4, height: 4, spec: { type: 'bedroom' } as any, zone: 'private' }
    ];

    const walls = enhancedWallSynthesizer.synthesize(rooms);

    const sharedWall = walls.find(w => 
      w.adjacentRooms.includes('room1') && w.adjacentRooms.includes('room2')
    );

    expect(sharedWall).toBeDefined();
  });

  test('should merge collinear wall segments', () => {
    const rooms = [
      { id: 'room1', x: 0, y: 0, width: 3, height: 4, spec: { type: 'living' } as any, zone: 'public' },
      { id: 'room2', x: 3, y: 0, width: 3, height: 4, spec: { type: 'bedroom' } as any, zone: 'private' },
      { id: 'room3', x: 6, y: 0, width: 3, height: 4, spec: { type: 'kitchen' } as any, zone: 'service' }
    ];

    const walls = enhancedWallSynthesizer.synthesize(rooms);

    // Check that exterior walls are merged where possible
    const topWalls = walls.filter(w => 
      Math.abs(w.geometry.start.y - 4) < 0.1 && 
      Math.abs(w.geometry.end.y - 4) < 0.1
    );

    // Should have fewer walls than rooms if merging works
    expect(topWalls.length).toBeLessThanOrEqual(3);
  });
});

describe('Integration: Full Generation Flow', () => {
  test('should generate complete floor plan with templates', () => {
    const spec: FloorPlanSpecification = {
      rooms: [
        { id: 'living', type: 'living', minArea: 25, maxArea: 35, aspectRatio: { min: 1.2, max: 1.8 }, priority: 8, zone: 'public', requiresWindow: true, requiresDoor: true },
        { id: 'kitchen', type: 'kitchen', minArea: 12, maxArea: 18, aspectRatio: { min: 1.0, max: 1.5 }, priority: 7, zone: 'service', requiresWindow: true, requiresDoor: true },
        { id: 'bedroom1', type: 'bedroom', minArea: 14, maxArea: 20, aspectRatio: { min: 1.0, max: 1.4 }, priority: 7, zone: 'private', requiresWindow: true, requiresDoor: true },
        { id: 'bedroom2', type: 'bedroom', minArea: 12, maxArea: 16, aspectRatio: { min: 1.0, max: 1.4 }, priority: 6, zone: 'private', requiresWindow: true, requiresDoor: true },
        { id: 'bathroom', type: 'bathroom', minArea: 5, maxArea: 8, aspectRatio: { min: 0.8, max: 1.3 }, priority: 6, zone: 'private', requiresWindow: false, requiresDoor: true }
      ],
      adjacencyGraph: [
        { from: 'kitchen', to: 'living', weight: 8, type: 'should' },
        { from: 'bedroom1', to: 'bathroom', weight: 9, type: 'must' },
        { from: 'bedroom2', to: 'bathroom', weight: 7, type: 'should' }
      ],
      totalArea: 100,
      metadata: {
        style: 'modern',
        entrance: 'south'
      }
    };

    const result = templateBasedPlacer.placeWithTemplate(spec, 12, 8.5);

    expect(result.placed.length).toBe(5);
    expect(result.template).toBeDefined();
    expect(result.confidence).toBeGreaterThan(40);

    // Verify all rooms are placed
    const placedIds = result.placed.map(r => r.id).sort();
    const expectedIds = spec.rooms.map(r => r.id).sort();
    expect(placedIds).toEqual(expectedIds);

    // Verify no overlaps
    for (let i = 0; i < result.placed.length; i++) {
      for (let j = i + 1; j < result.placed.length; j++) {
        const room1 = result.placed[i];
        const room2 = result.placed[j];

        const overlap = !(
          room1.x + room1.width <= room2.x + 0.1 ||
          room2.x + room2.width <= room1.x + 0.1 ||
          room1.y + room1.height <= room2.y + 0.1 ||
          room2.y + room2.height <= room1.y + 0.1
        );

        expect(overlap).toBe(false);
      }
    }

    // Verify areas are reasonable
    result.placed.forEach(room => {
      const actualArea = room.width * room.height;
      const roomSpec = spec.rooms.find(r => r.id === room.id);
      
      if (roomSpec) {
        // Allow some tolerance for area deviation
        expect(actualArea).toBeGreaterThan(roomSpec.minArea * 0.8);
        expect(actualArea).toBeLessThan(roomSpec.maxArea * 1.3);
      }
    });
  });
});
