import {
  cadModelProps,
  projectModelPath,
  requireBuiltinCoreBoardModel,
} from './BuiltinCoreBoardModels';

type Layer = 'top' | 'bottom';

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      chip: any;
    }
  }
}

const ESP32_S3_WROOM_1_MODEL = requireBuiltinCoreBoardModel('espressif_esp32_s3_wroom_1');
const ESP32_WROOM_32E_MODEL = requireBuiltinCoreBoardModel('espressif_esp32_wroom_32e');

export const ESPRESSIF_ESP32_MODULES = {
  esp32_s3_wroom_1: {
    id: 'esp32_s3_wroom_1',
    label: ESP32_S3_WROOM_1_MODEL.pcb.sourceIdentity.displayName,
    manufacturerPartNumber: ESP32_S3_WROOM_1_MODEL.pcb.sourceIdentity.manufacturerPartNumber,
    footprint: ESP32_S3_WROOM_1_MODEL.pcb.footprintId,
    cadModelId: ESP32_S3_WROOM_1_MODEL.id,
    cadModelPath: projectModelPath(ESP32_S3_WROOM_1_MODEL),
    cadModelOriginMm: ESP32_S3_WROOM_1_MODEL.pcb.model.transform.modelOriginPositionMm,
    registry: ESP32_S3_WROOM_1_MODEL,
    bodyMm: { x: 18, y: 25.5, z: 3.1 },
  },
  esp32_wroom_32e: {
    id: 'esp32_wroom_32e',
    label: ESP32_WROOM_32E_MODEL.pcb.sourceIdentity.displayName,
    manufacturerPartNumber: ESP32_WROOM_32E_MODEL.pcb.sourceIdentity.manufacturerPartNumber,
    footprint: ESP32_WROOM_32E_MODEL.pcb.footprintId,
    cadModelId: ESP32_WROOM_32E_MODEL.id,
    cadModelPath: projectModelPath(ESP32_WROOM_32E_MODEL),
    cadModelOriginMm: ESP32_WROOM_32E_MODEL.pcb.model.transform.modelOriginPositionMm,
    registry: ESP32_WROOM_32E_MODEL,
    bodyMm: { x: 18, y: 25.5, z: 3.2 },
  },
} as const;

export type EspressifEsp32ModuleVariant = keyof typeof ESPRESSIF_ESP32_MODULES;

export type EspressifEsp32ModuleProps = {
  name: string;
  variant: EspressifEsp32ModuleVariant;
  layer?: Layer;
  pcbX?: number | string;
  pcbY?: number | string;
  pcbRotation?: number | string;
  connections?: Record<string, string>;
};

export function EspressifEsp32Module(props: EspressifEsp32ModuleProps) {
  const module = ESPRESSIF_ESP32_MODULES[props.variant];
  return (
    <chip
      name={props.name}
      displayName={module.registry.pcb.sourceIdentity.displayName}
      layer={props.layer ?? 'top'}
      pcbX={props.pcbX ?? 0}
      pcbY={props.pcbY ?? 0}
      pcbRotation={props.pcbRotation ?? 0}
      manufacturerPartNumber={module.manufacturerPartNumber}
      footprint={module.footprint}
      cadModel={cadModelProps(module.registry)}
      connections={props.connections ?? {}}
    />
  );
}

export type Esp32ModuleConvenienceProps = Omit<EspressifEsp32ModuleProps, 'variant'>;

export function Esp32S3Wroom1(props: Esp32ModuleConvenienceProps) {
  return <EspressifEsp32Module {...props} variant="esp32_s3_wroom_1" />;
}

export function Esp32Wroom32E(props: Esp32ModuleConvenienceProps) {
  return <EspressifEsp32Module {...props} variant="esp32_wroom_32e" />;
}

export function listEsp32ModuleFootprintTemplates() {
  return Object.values(ESPRESSIF_ESP32_MODULES).map((module) => ({
    id: module.id,
    component: module.id === 'esp32_s3_wroom_1' ? 'Esp32S3Wroom1' : 'Esp32Wroom32E',
    importPath: './lib/footprints/index',
    description: `${module.label}: official KiCad footprint with exact bundled Espressif STEP model.`,
  }));
}
