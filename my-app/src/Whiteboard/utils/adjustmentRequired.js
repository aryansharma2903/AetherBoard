import { toolTypes } from "../../constants"

// [toolTypes.RECTANGLE] is an array, adjustmentRequired gets set to true if this array includes type
export const adjustmentRequired = (type) => [toolTypes.RECTANGLE, toolTypes.LINE].includes(type)