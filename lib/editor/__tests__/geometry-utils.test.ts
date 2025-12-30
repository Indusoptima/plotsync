import {
  pointInPolygon,
  pointInBoundingBox,
  pointsNear,
  lineIntersection,
  closestPointOnSegment,
  distanceToSegment,
  lineLength,
  boundingBoxFromVertices,
  boundingBoxesOverlap,
  polygonsIntersect,
  polygonArea,
  polygonCentroid,
  snapToGrid,
  snapPointToGrid,
  angleBetweenPoints,
  snapAngle,
  validateMinArea,
  validateAspectRatio,
} from '../geometry-utils';
import { Point2D, BoundingBox } from '../editor-store';

describe('Point and Polygon Utilities', () => {
  describe('pointInPolygon', () => {
    it('should detect point inside a square', () => {
      const square: Point2D[] = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 },
      ];
      
      expect(pointInPolygon({ x: 5, y: 5 }, square)).toBe(true);
      expect(pointInPolygon({ x: 0, y: 0 }, square)).toBe(true); // On vertex
      expect(pointInPolygon({ x: 15, y: 15 }, square)).toBe(false);
      expect(pointInPolygon({ x: -1, y: 5 }, square)).toBe(false);
    });

    it('should work with complex polygons', () => {
      const polygon: Point2D[] = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 5 },
        { x: 5, y: 5 },
        { x: 5, y: 10 },
        { x: 0, y: 10 },
      ];
      
      expect(pointInPolygon({ x: 2, y: 2 }, polygon)).toBe(true);
      expect(pointInPolygon({ x: 7, y: 2 }, polygon)).toBe(true);
      expect(pointInPolygon({ x: 7, y: 7 }, polygon)).toBe(false);
    });
  });

  describe('pointInBoundingBox', () => {
    it('should detect point inside box', () => {
      const box: BoundingBox = { x: 0, y: 0, width: 10, height: 10 };
      
      expect(pointInBoundingBox({ x: 5, y: 5 }, box)).toBe(true);
      expect(pointInBoundingBox({ x: 0, y: 0 }, box)).toBe(true);
      expect(pointInBoundingBox({ x: 10, y: 10 }, box)).toBe(true);
      expect(pointInBoundingBox({ x: 11, y: 5 }, box)).toBe(false);
    });
  });

  describe('pointsNear', () => {
    it('should detect nearby points', () => {
      const p1: Point2D = { x: 0, y: 0 };
      const p2: Point2D = { x: 0.05, y: 0.03 };
      const p3: Point2D = { x: 1, y: 1 };
      
      expect(pointsNear(p1, p2, 0.1)).toBe(true);
      expect(pointsNear(p1, p3, 0.1)).toBe(false);
      expect(pointsNear(p1, p3, 2)).toBe(true);
    });
  });
});

describe('Line Utilities', () => {
  describe('lineIntersection', () => {
    it('should find intersection of crossing lines', () => {
      const result = lineIntersection(
        { x: 0, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 },
        { x: 10, y: 0 }
      );
      
      expect(result).not.toBeNull();
      expect(result?.x).toBeCloseTo(5, 1);
      expect(result?.y).toBeCloseTo(5, 1);
    });

    it('should return null for parallel lines', () => {
      const result = lineIntersection(
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 0, y: 5 },
        { x: 10, y: 5 }
      );
      
      expect(result).toBeNull();
    });

    it('should return null for non-intersecting segments', () => {
      const result = lineIntersection(
        { x: 0, y: 0 },
        { x: 5, y: 0 },
        { x: 10, y: 0 },
        { x: 15, y: 0 }
      );
      
      expect(result).toBeNull();
    });
  });

  describe('lineLength', () => {
    it('should calculate line length correctly', () => {
      expect(lineLength({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
      expect(lineLength({ x: 0, y: 0 }, { x: 10, y: 0 })).toBe(10);
      expect(lineLength({ x: 0, y: 0 }, { x: 0, y: 0 })).toBe(0);
    });
  });

  describe('distanceToSegment', () => {
    it('should calculate distance to line segment', () => {
      const start: Point2D = { x: 0, y: 0 };
      const end: Point2D = { x: 10, y: 0 };
      
      expect(distanceToSegment({ x: 5, y: 3 }, start, end)).toBeCloseTo(3);
      expect(distanceToSegment({ x: 5, y: 0 }, start, end)).toBeCloseTo(0);
      expect(distanceToSegment({ x: 15, y: 0 }, start, end)).toBeCloseTo(5);
    });
  });
});

describe('Bounding Box Utilities', () => {
  describe('boundingBoxFromVertices', () => {
    it('should calculate bounding box from vertices', () => {
      const vertices: Point2D[] = [
        { x: 2, y: 3 },
        { x: 8, y: 1 },
        { x: 5, y: 9 },
        { x: 1, y: 5 },
      ];
      
      const box = boundingBoxFromVertices(vertices);
      
      expect(box.x).toBe(1);
      expect(box.y).toBe(1);
      expect(box.width).toBe(7);
      expect(box.height).toBe(8);
    });
  });

  describe('boundingBoxesOverlap', () => {
    it('should detect overlapping boxes', () => {
      const box1: BoundingBox = { x: 0, y: 0, width: 10, height: 10 };
      const box2: BoundingBox = { x: 5, y: 5, width: 10, height: 10 };
      const box3: BoundingBox = { x: 20, y: 20, width: 5, height: 5 };
      
      expect(boundingBoxesOverlap(box1, box2)).toBe(true);
      expect(boundingBoxesOverlap(box1, box3)).toBe(false);
      expect(boundingBoxesOverlap(box2, box3)).toBe(false);
    });
  });
});

describe('Polygon Utilities', () => {
  describe('polygonArea', () => {
    it('should calculate area of square', () => {
      const square: Point2D[] = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 },
      ];
      
      expect(polygonArea(square)).toBe(100);
    });

    it('should calculate area of triangle', () => {
      const triangle: Point2D[] = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 5, y: 10 },
      ];
      
      expect(polygonArea(triangle)).toBe(50);
    });
  });

  describe('polygonCentroid', () => {
    it('should calculate centroid of square', () => {
      const square: Point2D[] = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 },
      ];
      
      const centroid = polygonCentroid(square);
      
      expect(centroid.x).toBeCloseTo(5, 1);
      expect(centroid.y).toBeCloseTo(5, 1);
    });
  });

  describe('polygonsIntersect', () => {
    it('should detect intersecting polygons', () => {
      const poly1: Point2D[] = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 },
      ];
      
      const poly2: Point2D[] = [
        { x: 5, y: 5 },
        { x: 15, y: 5 },
        { x: 15, y: 15 },
        { x: 5, y: 15 },
      ];
      
      const poly3: Point2D[] = [
        { x: 20, y: 20 },
        { x: 25, y: 20 },
        { x: 25, y: 25 },
        { x: 20, y: 25 },
      ];
      
      expect(polygonsIntersect(poly1, poly2)).toBe(true);
      expect(polygonsIntersect(poly1, poly3)).toBe(false);
    });
  });
});

describe('Grid and Snap Utilities', () => {
  describe('snapToGrid', () => {
    it('should snap value to grid', () => {
      expect(snapToGrid(3.47, 0.1)).toBe(3.5);
      expect(snapToGrid(3.42, 0.1)).toBe(3.4);
      expect(snapToGrid(3.45, 0.1)).toBe(3.5);
      expect(snapToGrid(7.8, 1.0)).toBe(8);
      expect(snapToGrid(7.4, 1.0)).toBe(7);
    });
  });

  describe('snapPointToGrid', () => {
    it('should snap point to grid', () => {
      const point: Point2D = { x: 3.47, y: 5.82 };
      const snapped = snapPointToGrid(point, 0.1);
      
      expect(snapped.x).toBe(3.5);
      expect(snapped.y).toBe(5.8);
    });
  });
});

describe('Angle Utilities', () => {
  describe('angleBetweenPoints', () => {
    it('should calculate angle in degrees', () => {
      expect(angleBetweenPoints({ x: 0, y: 0 }, { x: 1, y: 0 })).toBeCloseTo(0, 1);
      expect(angleBetweenPoints({ x: 0, y: 0 }, { x: 0, y: 1 })).toBeCloseTo(90, 1);
      expect(angleBetweenPoints({ x: 0, y: 0 }, { x: -1, y: 0 })).toBeCloseTo(180, 0);
      expect(angleBetweenPoints({ x: 0, y: 0 }, { x: 0, y: -1 })).toBeCloseTo(-90, 1);
    });
  });

  describe('snapAngle', () => {
    it('should snap angle to increment', () => {
      expect(snapAngle(47, 90)).toBe(0);
      expect(snapAngle(50, 90)).toBe(90);
      expect(snapAngle(137, 90)).toBe(180);
      expect(snapAngle(22.5, 45)).toBe(0);
      expect(snapAngle(25, 45)).toBe(45);
    });
  });
});

describe('Constraint Validation Utilities', () => {
  describe('validateMinArea', () => {
    it('should validate minimum area', () => {
      expect(validateMinArea(5, 4)).toBe(true);
      expect(validateMinArea(4, 4)).toBe(true);
      expect(validateMinArea(3.9, 4)).toBe(false);
    });
  });

  describe('validateAspectRatio', () => {
    it('should validate aspect ratio', () => {
      expect(validateAspectRatio(10, 10, 1/3, 3)).toBe(true); // 1:1 ratio
      expect(validateAspectRatio(12, 4, 1/3, 3)).toBe(true); // 3:1 ratio
      expect(validateAspectRatio(4, 12, 1/3, 3)).toBe(true); // 1:3 ratio
      expect(validateAspectRatio(16, 4, 1/3, 3)).toBe(false); // 4:1 ratio (too wide)
    });
  });
});
