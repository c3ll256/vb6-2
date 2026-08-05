import boardModelRegistry from './board-models.json';

type Point3 = { x: number; y: number; z: number };

type BoundPcbModel = {
  status: 'bound';
  componentExport: string;
  componentSource: string;
  footprintId: string;
  sourceIdentity: {
    displayName: string;
    manufacturerPartNumber: string;
  };
  model: {
    assetPath: string;
    sha256: string;
    transform: {
      modelOriginPositionMm: Point3;
      rotationOffsetDeg: Point3;
      modelUnitToMmScale: number;
      modelBoardNormalDirection: 'x+' | 'x-' | 'y+' | 'y-' | 'z+' | 'z-';
    };
  };
  interfaces: Array<{
    id: string;
    kind: string;
    connectorEdge: '+X' | '-X' | '+Y' | '-Y';
    verifiedModelBboxMm: { min: Point3; max: Point3 };
    evidence: string;
    notes: string[];
  }>;
};

export type BuiltinCoreBoardModel = {
  id: string;
  name: string;
  kind: 'development_board' | 'module';
  revision: string;
  pcb: BoundPcbModel;
};

function isBuiltinCoreBoardModel(value: unknown): value is BuiltinCoreBoardModel {
  if (!value || typeof value !== 'object') return false;
  const row = value as Partial<BuiltinCoreBoardModel>;
  return typeof row.id === 'string' && row.pcb?.status === 'bound';
}

export const BUILTIN_CORE_BOARD_MODELS = (boardModelRegistry as unknown[]).filter(
  isBuiltinCoreBoardModel,
);

export function requireBuiltinCoreBoardModel(id: string): BuiltinCoreBoardModel {
  const model = BUILTIN_CORE_BOARD_MODELS.find((row) => row.id === id);
  if (!model) throw new Error(`builtin_core_board_model_missing:${id}`);
  return model;
}

export function projectModelPath(model: BuiltinCoreBoardModel): string {
  const filename = model.pcb.model.assetPath.split(/[\\/]/).pop();
  if (!filename) throw new Error(`builtin_core_board_model_filename_missing:${model.id}`);
  return `./src/lib/footprints/models/${filename}`;
}

export function cadModelProps(model: BuiltinCoreBoardModel) {
  const transform = model.pcb.model.transform;
  return {
    stepUrl: projectModelPath(model),
    modelOriginPosition: transform.modelOriginPositionMm,
    rotationOffset: transform.rotationOffsetDeg,
    modelUnitToMmScale: transform.modelUnitToMmScale,
    modelBoardNormalDirection: transform.modelBoardNormalDirection,
  };
}
