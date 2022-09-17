import { CONVERSION_NATIVE_TYPE_NAME } from "../native/NativeConstants";
import type ConversionDefinition from "../nodes/ConversionDefinition";
import Context from "../nodes/Context";
import type Evaluation from "./Evaluation";
import Primitive from "./Primitive";
import Value from "./Value";

export default class ConversionValue extends Primitive {
    /** The definition from the AST. */
    readonly definition: ConversionDefinition;
    
    /** The evaluation context in which this function was created. This enables closures. */
    readonly context: Evaluation | Value;

    constructor(definition: ConversionDefinition, context: Evaluation | Value) {
        super();

        this.definition = definition;
        this.context = context;
    }

    getType() { 
        return this.context instanceof Value ? 
            this.context.getType() :
            this.definition.getTypeUnlessCycle(new Context(this.context.getEvaluator().program, this.context.getEvaluator().getShares())); 
    }

    getNativeTypeName(): string { return CONVERSION_NATIVE_TYPE_NAME; }

    toString() { return this.definition.toWordplay(); }

}