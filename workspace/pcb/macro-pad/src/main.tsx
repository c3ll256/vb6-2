import { board } from "./layout";
import {
  boardPropsFromRules,
  groundPourPropsFromRules,
  keepoutPropsFromRules,
  netPropsFor,
  pcbRules,
} from "./lib/replicator-pcb";

const PcbRuleElements = () => (
  <>
    {Object.keys(pcbRules.nets).map((netName) => (
      <net key={netName} name={netName} {...netPropsFor(netName)} />
    ))}
    {groundPourPropsFromRules().map((pour) => (
      <copperpour key={pour.name} {...pour} />
    ))}
    {keepoutPropsFromRules().map((keepout) => (
      <keepout {...keepout} />
    ))}
  </>
);

// Credit-card USB Macro Pad
// tscircuit is the source of truth for circuit, footprint, placement, and explicit pcbPath copper.
// Declare routing policy, pours, keepouts, and BOM bindings in pcb.config.json.
// Use rotationForOpening() from "./layout" for connector orientation intent.
export default () => (
  <board
    width={board.width}
    height={board.height}
    center_x={0}
    center_y={0}
    {...boardPropsFromRules()}
  >
    <PcbRuleElements />
  </board>
);
