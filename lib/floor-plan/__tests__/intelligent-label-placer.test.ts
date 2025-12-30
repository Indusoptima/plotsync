/**
 * Unit Tests for Intelligent Label Placer
 */

import { describe, test, expect } from '@jest/globals';
import { intelligentLabelPlacer } from '../stage-c/intelligent-label-placer';
import { RoomGeometry } from '../types';

describe('IntelligentLabelPlacer', () => {
  const createTestRoom = (id: string, x: number, y: number, width: number, height: number): RoomGeometry => ({
    id,
    type: 'bedroom',
    geometry: {
      vertices: [
        { x, y },
        { x: x + width, y },
        { x: x + width, y: y + height },
        { x, y: y + height }
      ],
      centroid: { x: x + width / 2, y: y + height / 2 },
      area: width * height,
      bounds: { x, y, width, height }
    },
    labels: {
      name: 'Bedroom',
      area: `${(width * height).toFixed(1)} m²`,
      dimensions: `${width.toFixed(1)}m × ${height.toFixed(1)}m`
    }
  });

  describe('placeLabels', () => {
    test('should place labels for all rooms', () => {
      const rooms: RoomGeometry[] = [
        createTestRoom('bedroom1', 0, 0, 4, 3.5),
        createTestRoom('kitchen', 4, 0, 3, 3),
        createTestRoom('living', 0, 3.5, 5, 4)
      ];
      
      const placements = intelligentLabelPlacer.placeLabels(rooms, 15);
      
      expect(placements.length).toBe(3);
      expect(placements.map(p => p.roomId)).toEqual(expect.arrayContaining(['bedroom1', 'kitchen', 'living']));
    });

    test('should place labels at room centroids when possible', () => {
      const rooms: RoomGeometry[] = [
        createTestRoom('bedroom', 0, 0, 5, 4)
      ];
      
      const placements = intelligentLabelPlacer.placeLabels(rooms, 15);
      
      expect(placements.length).toBe(1);
      expect(placements[0].position.x).toBe(2.5); // Center of 5m width
      expect(placements[0].position.y).toBe(2.0); // Center of 4m height
    });

    test('should avoid overlapping labels', () => {
      const rooms: RoomGeometry[] = [
        createTestRoom('room1', 0, 0, 2, 2), // Small adjacent rooms
        createTestRoom('room2', 2, 0, 2, 2)
      ];
      
      const placements = intelligentLabelPlacer.placeLabels(rooms, 15);
      
      expect(placements.length).toBe(2);
      
      // Check that labels don't overlap (simplified check)
      const label1 = placements[0];
      const label2 = placements[1];
      
      const distance = Math.sqrt(
        Math.pow(label2.position.x - label1.position.x, 2) +
        Math.pow(label2.position.y - label1.position.y, 2)
      );
      
      expect(distance).toBeGreaterThan(0.5); // Should have some separation
    });

    test('should include secondary labels when space allows', () => {
      const rooms: RoomGeometry[] = [
        createTestRoom('bedroom', 0, 0, 5, 4) // Large room
      ];
      
      const placements = intelligentLabelPlacer.placeLabels(rooms, 15);
      
      expect(placements.length).toBe(1);
      expect(placements[0].text).toBe('Bedroom');
      expect(placements[0].secondaryText).toContain('m²');
    });

    test('should reduce font size when label doesn\'t fit', () => {
      const rooms: RoomGeometry[] = [
        createTestRoom('VeryLongRoomNameThatWontFit', 0, 0, 2, 1.5) // Small room
      ];
      
      const placements = intelligentLabelPlacer.placeLabels(rooms, 15);
      
      expect(placements.length).toBe(1);
      // Font size should be reduced from default 13px
      expect(placements[0].fontSize).toBeLessThanOrEqual(13);
    });

    test('should handle multiple rooms without collisions', () => {
      const rooms: RoomGeometry[] = [
        createTestRoom('bedroom1', 0, 0, 3.5, 3),
        createTestRoom('bedroom2', 3.5, 0, 3.5, 3),
        createTestRoom('living', 0, 3, 5, 4),
        createTestRoom('kitchen', 5, 3, 3, 4)
      ];
      
      const placements = intelligentLabelPlacer.placeLabels(rooms, 15);
      
      expect(placements.length).toBe(4);
      
      // Verify no overlaps (comprehensive check)
      for (let i = 0; i < placements.length; i++) {
        for (let j = i + 1; j < placements.length; j++) {
          const p1 = placements[i];
          const p2 = placements[j];
          
          const minSeparation = 0.3; // Minimum 30cm separation in world coordinates
          const distance = Math.sqrt(
            Math.pow(p2.position.x - p1.position.x, 2) +
            Math.pow(p2.position.y - p1.position.y, 2)
          );
          
          expect(distance).toBeGreaterThan(minSeparation);
        }
      }
    });
  });
});
