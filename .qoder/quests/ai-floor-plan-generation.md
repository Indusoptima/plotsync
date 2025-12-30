# AI Floor Plan Generation Enhancement

## Quick Start Guide

**Current Issue:** Floor plan generation produces unrealistic layouts with limited variation.

**Recommended Solution:** Three-phase approach
- **Phase 1** (2-4 weeks): Enhanced Constraint Solver - No ML training required
- **Phase 2** (1-2 months): Research prototype with diffusion models
- **Phase 3** (3-6 months): Production ML system

**Immediate Action:** Start with Phase 1 - see detailed implementation below.

---

## Overview

The current floor plan generation system uses a multi-stage pipeline with LLM-based specification generation. However, this approach faces limitations in generating realistic, architecturally valid floor plans. This design proposes alternative architectures inspired by state-of-the-art research, particularly Maket.ai-style approaches that leverage modern deep learning techniques including diffusion models, graph neural networks, and constraint-based generation.

### Current System Analysis

**Existing Architecture:**
- **Stage A**: LLM converts user input to FloorPlanSpecification (room requirements, adjacency graph)
- **Stage B**: Constraint solver places rooms, wall synthesizer creates walls, opening placer adds doors/windows
- **Stage C**: 3D visualization and SVG export

**Identified Issues:**
- LLM-based specification often produces unrealistic layouts
- Constraint solver struggles with complex spatial relationships
- Limited ability to learn from architectural best practices
- Lacks visual understanding of floor plan aesthetics
- Fallback mechanism generates simplistic grid layouts
- No training on actual floor plan datasets

### Research Findings

**Modern Approaches:**

1. **Diffusion Models** (HouseDiffusion, ChatHouseDiffusion)
   - Treat floor plan generation as image generation problem
   - Learn from large datasets of real floor plans
   - Support both raster (pixel-based) and vector outputs
   - Enable iterative refinement and editing
   - Better capture spatial relationships and architectural patterns

2. **Graph Neural Networks** (HouseGAN++, Graph2Plan)
   - Model room adjacency and topology as graphs
   - Learn spatial constraints from data
   - Support topology-guided generation
   - Handle variable room counts naturally

3. **Hybrid Architectures** (ChatHouseDiffusion, GSDiff)
   - Combine LLM for natural language understanding
   - Graphormer for topology encoding
   - Diffusion model for geometric generation
   - Attention-based editing for local modifications

## Recommended Architecture Approaches

### Approach 1: Latent Diffusion Model (Maket.ai-style)

**Concept:**
Generate floor plans using a two-condition diffusion model that takes building footprint and textual description as inputs.

**System Components:**

| Component | Purpose | Input | Output |
|-----------|---------|-------|--------|
| **Text Encoder** | Convert user requirements to embeddings | Natural language description | Text embeddings (768-dim) |
| **Footprint Encoder** | Encode building boundary | Building outline image/vector | Spatial embeddings |
| **Latent Diffusion Core** | Generate floor plan in latent space | Text + Footprint embeddings | Latent representation |
| **Decoder Network** | Convert to floor plan | Latent vectors | Floor plan image/vector |
| **Post-Processor** | Extract structured data | Floor plan raster/vector | Rooms, walls, doors, windows |

**Generation Flow:**

``mermaid
graph TD
    A[User Input: Area, Rooms, Style] --> B[Text Encoder]
    A --> C[Footprint Generator]
    B --> D[Text Embeddings]
    C --> E[Footprint Image]
    D --> F[Latent Diffusion Model]
    E --> F
    F --> G[Denoising Process T steps]
    G --> H[Decoder Network]
    H --> I[Floor Plan Image]
    I --> J[Post-Processing]
    J --> K[Structured Output]
    K --> L[Rooms]
    K --> M[Walls]
    K --> N[Doors/Windows]
```

**Training Strategy:**

| Stage | Dataset Requirement | Training Objective | Expected Outcome |
|-------|--------------------|--------------------|------------------|
| **Stage 1: Pre-training** | Large floor plan dataset (10K+ samples) | Unconditional diffusion | Learn general floor plan distributions |
| **Stage 2: Text Conditioning** | Floor plans with descriptions | Text-conditioned diffusion | Align plans with requirements |
| **Stage 3: Footprint Conditioning** | Floor plans with footprints | Dual-condition diffusion | Respect building boundaries |
| **Stage 4: Fine-tuning** | High-quality residential plans | Quality-weighted loss | Improve architectural realism |

**Advantages:**
- Learns realistic spatial layouts from data
- Supports flexible input conditions
- Generates visually coherent plans
- Enables iterative refinement
- Better handles complex constraints

**Challenges:**
- Requires large training dataset
- Computationally intensive training
- May need specialized hardware (GPU)
- Post-processing needed for structured output

### Approach 2: Graph-Guided Diffusion (Hybrid)

**Concept:**
Combine graph neural networks for topology with diffusion models for geometry generation.

**System Components:**

| Component | Purpose | Technology | Responsibility |
|-----------|---------|----------|----------------|
| **LLM Parser** | Extract requirements from natural language | GPT/Gemini API | Parse room types, counts, preferences |
| **Graph Constructor** | Build adjacency graph | Rule-based + Learning | Create topology constraints |
| **Graphormer Encoder** | Encode graph structure | Transformer for graphs | Generate graph embeddings |
| **Diffusion Generator** | Generate floor plan geometry | DDPM with attention | Produce pixel/vector floor plan |
| **Vector Extractor** | Convert to structured format | Post-processing | Extract walls, rooms, openings |

**Generation Pipeline:**

``mermaid
graph TD
    A[Natural Language Input] --> B[LLM Parser]
    B --> C[Room Specifications]
    C --> D[Graph Constructor]
    D --> E[Adjacency Graph]
    E --> F[Graphormer Encoder]
    F --> G[Graph Embeddings]
    G --> H[Diffusion Model]
    H --> I[Denoising T steps]
    I --> J[Floor Plan Image]
    J --> K[Vector Extractor]
    K --> L[Structured Output]
```

**Topology Graph Structure:**

| Graph Element | Representation | Attributes |
|---------------|----------------|------------|
| **Nodes** | Rooms | Type, min/max area, zone (public/private) |
| **Edges** | Adjacency relationships | Weight (1-10), type (must/should/avoid) |
| **Global Features** | Building constraints | Total area, aspect ratio, entrance side |

**Training Approach:**

Without pre-trained models, this approach can use:
1. **Rule-based graph construction**: Expert-defined adjacency rules (kitchen→dining, bedroom→bathroom)
2. **Constraint-aware diffusion**: Guide generation with architectural rules
3. **Template-based learning**: Learn from small dataset of good examples
4. **Progressive refinement**: Start with simple layouts, add complexity

**Advantages:**
- Explicit topology control
- Natural handling of adjacency constraints
- Can work with smaller datasets
- Interpretable graph structure

**Challenges:**
- Still requires diffusion model training
- Graph construction complexity
- Needs careful graph-to-geometry mapping

### Approach 3: Enhanced Constraint Solver (Minimal Change)

**Concept:**
Improve existing constraint solver without requiring deep learning training.

**Enhancement Strategy:**

| Component | Current State | Proposed Enhancement | Expected Improvement |
|-----------|---------------|---------------------|---------------------|
| **Room Placement** | Simple grid/linear layout | Multi-objective optimization with architectural rules | More realistic layouts |
| **Wall Synthesis** | Bounding box walls | Intelligent wall merging, L-shaped rooms | Better space utilization |
| **Opening Placement** | Random/fixed positions | Rule-based placement (windows on exterior, doors at circulation nodes) | Functional accessibility |
| **Layout Templates** | 5 hard-coded variations | 20+ template library with interpolation | Greater diversity |
| **Constraint Scoring** | Binary success/failure | Weighted scoring with relaxation priorities | Better constraint satisfaction |

**Architectural Rule Engine:**

``mermaid
graph TD
    A[Room Specifications] --> B[Rule Engine]
    B --> C{Zone Classification}
    C -->|Public| D[Living, Dining, Kitchen]
    C -->|Private| E[Bedrooms, Bathrooms]
    C -->|Service| F[Utility, Storage]
    D --> G[Adjacency Rules]
    E --> G
    F --> G
    G --> H[Constraint Solver]
    H --> I[Layout Optimization]
    I --> J{Validation}
    J -->|Pass| K[Wall Synthesis]
    J -->|Fail| L[Constraint Relaxation]
    L --> H
    K --> M[Opening Placement]
    M --> N[Final Layout]
```

**Enhanced Constraint Types:**

| Constraint Category | Rules | Priority |
|-------------------|-------|----------|
| **Functional Adjacency** | Kitchen adjacent to dining; Bedrooms near bathrooms | High |
| **Circulation** | All rooms accessible from hallway/entrance; Minimum clearance 900mm | Required |
| **Privacy Zones** | Bedrooms away from entrance; Bathrooms not visible from living areas | Medium |
| **Natural Light** | Bedrooms and living rooms have exterior wall access | High |
| **Proportions** | Room aspect ratios 1:1 to 1:2; Avoid long narrow corridors | Medium |
| **Entry Flow** | Entrance → Living/Dining (not directly to private zones) | High |

**Template Library Structure:**

| Template Type | Description | Room Count Range | Characteristics |
|---------------|-------------|------------------|-----------------|
| **Linear** | Single-loaded corridor | 3-6 rooms | Simple, efficient |
| **Clustered** | Grouped by function | 4-8 rooms | Functional zones |
| **L-Shaped** | Two wings at 90° | 5-10 rooms | Corner lots, privacy |
| **Courtyard** | Rooms around central space | 6-12 rooms | Natural light, outdoor access |
| **Split-Level** | Functional separation | 5-9 rooms | Public/private division |

**Advantages:**
- No training required
- Immediate implementation
- Builds on existing codebase
- Predictable behavior
- Low computational cost

**Limitations:**
- Still algorithmic, not learning-based
- Limited ability to capture complex patterns
- May not match hand-designed quality
- Requires extensive rule engineering

## Recommended Implementation Strategy

### Phase 1: Short-term Enhancement (2-4 weeks)

**Objective:** Improve current system without ML training

**Actions:**
1. Implement Enhanced Constraint Solver (Approach 3)
2. Add architectural rule engine  
3. Expand template library from 5 to 20+ variations
4. Implement multi-objective scoring
5. Add validation with architectural standards

**Expected Outcome:**
- 50-70% improvement in layout quality
- More diverse variations
- Better constraint satisfaction
- Reduced need for LLM fallback

## Phase 1 Implementation Details (Enhanced Constraint Solver)

### Current System Strengths

Your existing system already has solid foundations:
- Zone-based placement with public/private/service zones
- Multi-objective scoring system
- Simulated annealing optimization
- Adjacency graph support

### Identified Improvement Areas

| Current Limitation | Impact | Priority |
|--------------------|--------|----------|
| **Limited layout templates** | Only 2 basic patterns (linear, grid) in fallback | High |
| **Generic adjacency rules** | Doesn't use architectural best practices | High |
| **Simple wall synthesis** | Creates boxy, unrealistic room shapes | Medium |
| **Random opening placement** | Doors/windows in non-functional positions | High |
| **No entrance strategy** | Entry location not architecturally considered | Medium |
| **Limited variation diversity** | 5 variations too similar | Medium |

### Enhancement 1: Expand Template Library

**Objective:** Increase diversity of generated layouts

**Actions:**
1. Design 20+ new templates with varying room counts and configurations
2. Implement interpolation between templates for smooth transitions

**Expected Outcome:**
- 20+ diverse templates
- Ability to generate unique layouts

### Enhancement 2: Improve Adjacency Rules

**Objective:** Incorporate architectural best practices

**Actions:**
1. Research and document architectural rules for room adjacency
2. Implement these rules in the constraint solver

**Expected Outcome:**
- More realistic room placements
- Better adherence to architectural standards

### Enhancement 3: Enhance Wall Synthesis

**Objective:** Create more natural room shapes

**Actions:**
1. Implement intelligent wall merging to avoid boxy rooms
2. Support L-shaped rooms for better space utilization

**Expected Outcome:**
- More realistic room shapes
- Better space utilization

### Enhancement 4: Improve Opening Placement

**Objective:** Ensure functional accessibility

**Actions:**
1. Place windows on exterior walls for natural light
2. Place doors at circulation nodes for easy access

**Expected Outcome:**
- Functional accessibility
- Better user experience

### Enhancement 5: Implement Entrance Strategy

**Objective:** Consider entry location in layout

**Actions:**
1. Define entrance location based on architectural rules
2. Ensure all rooms are accessible from the entrance

**Expected Outcome:**
- Architecturally sound entry location
- All rooms accessible

### Implementation Checklist

- [ ] Design 20+ new templates
- [ ] Implement interpolation between templates
- [ ] Research and document architectural rules
- [ ] Implement rules in constraint solver
- [ ] Implement intelligent wall merging
- [ ] Support L-shaped rooms
- [ ] Place windows on exterior walls
- [ ] Place doors at circulation nodes
- [ ] Define entrance location
- [ ] Ensure all rooms are accessible

### Configuration Updates

- Update template library with new designs
- Update adjacency rules in constraint solver
- Update wall synthesis algorithm
- Update opening placement rules
- Update entrance strategy

### Expected Improvements

- 50-70% improvement in layout quality
- More diverse variations
- Better constraint satisfaction
- Reduced need for LLM fallback

### Validation Testing

- Test with various user inputs
- Validate against architectural standards
- Measure improvement in layout quality

### Phase 2: Research Integration (1-2 months)

**Objective:** Explore diffusion/GNN approaches with existing datasets

**Actions:**
1. Research available pre-trained models (HouseDiffusion, HouseGAN++)
2. Investigate transfer learning from image diffusion models
3. Collect or generate training dataset (500-1000 plans)
4. Prototype hybrid approach (LLM + Graph + Constraint)
5. Benchmark against current system

**Expected Outcome:**
- Proof-of-concept diffusion-based generator
- Understanding of training requirements
- Performance comparison data
- Decision point for full implementation

### Phase 3: Production ML System (3-6 months)

**Objective:** Deploy production-ready diffusion model

**Actions:**
1. Acquire/curate large dataset (5K+ floor plans)
2. Train latent diffusion model
3. Implement graph-guided conditioning
4. Build post-processing pipeline
5. A/B test against constraint-based system
6. Gradual rollout with fallback

**Expected Outcome:**
- Maket.ai-comparable generation quality
- Support for natural language input
- Iterative editing capability
- 80-90% user satisfaction with outputs

## Data Requirements

### For Constraint-Based Enhancement (Approach 3)

| Data Type | Quantity | Source | Usage |
|-----------|----------|--------|-------|
| **Architectural Rule Set** | 50-100 rules | Expert knowledge, building codes | Constraint engine |
| **Layout Templates** | 20-30 templates | Design manually or curate | Template library |
| **Validation Cases** | 50-100 plans | Architectural firms, online | Testing, benchmarking |

### For Diffusion Model (Approach 1 & 2)

| Data Type | Quantity | Source | Usage |
|-----------|----------|--------|-------|
| **Training Dataset** | 5,000-10,000 plans | RPLAN, CubiCasa5K, custom scraping | Model training |
| **Validation Set** | 500-1,000 plans | Separate from training | Hyperparameter tuning |
| **Test Set** | 200-500 plans | Gold standard designs | Evaluation |
| **Textual Descriptions** | Matched with plans | Manual annotation or generation | Text conditioning |

**Available Public Datasets:**
- **RPLAN**: 80,000+ residential floor plans (Chinese apartments)
- **CubiCasa5K**: 5,000 floor plans with annotations
- **ResPlan**: 17,000 vector floor plans (recent, high quality)
- **LIFULL HOME'S Dataset**: 50,000+ Japanese floor plans

## Quality Metrics

### Architectural Validity

| Metric | Measurement | Target |
|--------|-------------|--------|
| **Room Accessibility** | % rooms reachable from entrance | 100% |
| **Circulation Efficiency** | Hallway area / Total area | < 15% |
| **Natural Light** | % living spaces with exterior wall | > 80% |
| **Privacy Compliance** | Bedrooms not adjacent to entrance | 100% |
| **Proportion Compliance** | % rooms with aspect ratio 1:1 to 1:2 | > 70% |

### User Satisfaction

| Metric | Measurement | Target |
|--------|-------------|--------|
| **First-Pass Acceptance** | % plans accepted without modification | > 60% |
| **Variation Quality** | % unique, non-similar variations | > 80% |
| **Requirement Match** | % plans meeting all specified requirements | > 90% |
| **Generation Speed** | Time to generate 5 variations | < 10s |

### Technical Performance

| Metric | Measurement | Target |
|--------|-------------|--------|
| **Constraint Satisfaction** | % high-priority constraints met | > 95% |
| **Area Accuracy** | Deviation from requested total area | < 5% |
| **Structural Validity** | % plans with closed walls, valid topology | 100% |
| **Variation Diversity** | Structural similarity between variations | < 30% |

## Alternative Libraries and Tools

### Open-Source Research Implementations

| Library/Project | Technology | Availability | Suitability |
|-----------------|------------|--------------|-------------|
| **HouseDiffusion** | Diffusion + Transformer | GitHub (research code) | High - state-of-the-art, vectorized output |
| **HouseGAN++** | GAN + Graph CNN | GitHub (research code) | Medium - GAN limitations, requires topology |
| **Graph2Plan** | GNN + CNN | Research paper only | Low - no public implementation |
| **ChatHouseDiffusion** | LLM + Diffusion + Graphormer | Recent (2024), may be available | High - natural language support, editing |

### Commercial/Semi-Commercial Options

| Service | Approach | Integration Method | Consideration |
|---------|----------|-------------------|---------------|
| **Maket.ai** | Proprietary diffusion models | API (if available) or partnership | High quality, but requires licensing |
| **Archistar** | AI-powered generative design | Platform API | Focused on commercial buildings |
| **Spacemaker** | Optimization algorithms | Cloud API | Site planning, not interior layouts |
| **Stable Diffusion (Fine-tuned)** | Generic image diffusion | Self-hosted model | Requires custom training on floor plans |

### Recommended Integration Path

**Option 1: Research Code Adaptation**
- Fork HouseDiffusion or ChatHouseDiffusion repository
- Adapt to your data format and requirements
- Integrate as microservice with API
- Advantage: State-of-the-art quality, full control
- Challenge: Research code may need production hardening

**Option 2: Transfer Learning from Image Models**
- Use pre-trained Stable Diffusion or similar
- Fine-tune on floor plan dataset
- Add ControlNet for boundary/topology conditioning
- Advantage: Leverage existing infrastructure
- Challenge: Requires significant adaptation

**Option 3: Hybrid Approach**
- Keep LLM for requirement parsing
- Use enhanced constraint solver for initial layout
- Apply diffusion model for refinement/styling
- Advantage: Balanced quality and implementation effort
- Challenge: Complexity of integration

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation Strategy |
|------|-----------|--------|---------------------|
| **Diffusion model training fails** | Medium | High | Start with constraint enhancement; have fallback |
| **Insufficient training data** | Medium | High | Use transfer learning; synthetic data generation |
| **Computational costs too high** | Low | Medium | Optimize inference; use caching; GPU optimization |
| **Generated plans violate codes** | Medium | High | Post-validation layer; constraint-guided generation |
| **User expectations exceed capability** | Medium | Medium | Clear communication; iterative improvement |

## Architectural Decision Record

### Decision 1: Multi-Phase Rollout

**Context:** Uncertainty about diffusion model performance and training feasibility

**Decision:** Implement in 3 phases (constraint enhancement → research prototype → production ML)

**Rationale:**
- Provides immediate improvement
- Reduces risk of ML approach failure
- Allows learning and adjustment
- Delivers value progressively

**Alternatives Considered:**
- Direct jump to diffusion model (too risky, long time-to-value)
- Only constraint enhancement (limited long-term potential)

### Decision 2: Prioritize Constraint Solver Enhancement

**Context:** Current system quality issues need immediate addressing

**Decision:** Focus Phase 1 on enhanced constraint solver with architectural rules

**Rationale:**
- No training data required
- Can be implemented quickly
- Builds on existing codebase
- Provides measurable improvement
- Serves as baseline for ML comparison

**Alternatives Considered:**
- Wait for diffusion model (delays improvement)
- Improve LLM prompting only (insufficient for quality)

### Decision 3: Target Hybrid Architecture Long-term

**Context:** Multiple successful approaches exist (pure diffusion, pure GNN, hybrid)

**Decision:** Aim for LLM + Graph + Diffusion hybrid architecture

**Rationale:**
- LLM: Excellent at parsing natural language
- Graph: Explicit topology control
- Diffusion: Learned spatial layouts and aesthetics
- Combination leverages strengths of each

**Alternatives Considered:**
- Pure diffusion (less control over constraints)
- Pure constraint-based (limited learning capability)
- Pure GNN (requires extensive graph engineering)

## Integration Architecture

### System Integration Points

``mermaid
graph TD
    A[Frontend: Parameter Input] --> B[API: /generate-floor-plan-v3]
    B --> C{Generation Mode}
    C -->|Fast/Fallback| D[Enhanced Constraint Solver]
    C -->|Quality| E[ML Pipeline]
    D --> F[Template Selection]
    F --> G[Multi-Objective Optimization]
    G --> H[Wall Synthesis]
    H --> I[Opening Placement]
    I --> J[Validation]
    E --> K[LLM Parser]
    K --> L[Graph Constructor]
    L --> M[Diffusion Generator]
    M --> N[Vector Extractor]
    N --> J
    J --> O{Valid?}
    O -->|Yes| P[SVG Rendering]
    O -->|No| Q[Fallback to Constraint]
    Q --> D
    P --> R[3D Scene Generation]
    R --> S[Response to Frontend]
```

### Service Architecture

| Service | Technology | Responsibility | Scalability |
|---------|-----------|----------------|-------------|
| **API Gateway** | Next.js API Routes | Request routing, authentication | Horizontal (Vercel) |
| **Constraint Solver Service** | TypeScript/Node | Rule-based generation | Stateless, cacheable |
| **ML Inference Service** | Python/FastAPI | Diffusion model inference | GPU instances, load balanced |
| **Post-Processing Service** | TypeScript | Vector extraction, validation | Stateless |
| **SVG Rendering Service** | Existing Stage C | Visual output generation | Stateless |

### Data Flow

| Step | Input | Process | Output | Latency |
|------|-------|---------|--------|---------|
| 1. Parse Request | User parameters | Validation, normalization | Standardized spec | <100ms |
| 2. Generate Layout | Spec | Constraint solver OR diffusion | Room placements | 2-8s |
| 3. Synthesize Walls | Room placements | Wall merging, optimization | Wall segments | <500ms |
| 4. Place Openings | Walls, rooms | Rule-based placement | Doors, windows | <300ms |
| 5. Validate | Complete geometry | Architectural rules check | Pass/fail + fixes | <200ms |
| 6. Render | Geometry | SVG generation | Visual output | <500ms |
| **Total** | | | | **3-10s** |

## Testing Strategy

### Validation Levels

| Level | Scope | Method | Frequency |
|-------|-------|--------|-----------|
| **Unit Tests** | Individual components (constraint solver, graph builder) | Jest, automated | Every commit |
| **Integration Tests** | End-to-end generation pipeline | Automated API tests | Every PR |
| **Architectural Validation** | Building code compliance | Rule-based checker | Every generation |
| **Visual Quality** | Human evaluation | A/B testing, surveys | Weekly |
| **Performance Tests** | Latency, throughput | Load testing | Pre-release |

### Evaluation Metrics

**Automated Metrics:**
- Constraint satisfaction rate
- Area accuracy (target ±5%)
- Accessibility (all rooms reachable)
- Structural validity (closed walls)
- Generation success rate (no crashes)

**Human Evaluation:**
- Realism score (1-10 scale)
- Layout functionality
- Aesthetic appeal
- Variation diversity
- Requirement alignment

## Future Enhancements

### Short-term (3-6 months)

- Multi-floor support
- Custom furniture placement
- Style transfer (modern, traditional, minimalist)
- Interactive editing with attention-based modifications
- Export to CAD formats (DXF, DWG)

### Long-term (6-12 months)

- Site-responsive design (orientation, views, climate)
- Code compliance checking (automated)
- Cost estimation integration
- Sustainability metrics (daylight, energy)
- VR walkthrough generation
- Collaborative design (multi-user)
