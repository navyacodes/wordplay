import type ConversionDefinition from "./ConversionDefinition";
import type FunctionDefinition from "./FunctionDefinition";
import type Context from "./Context";
import Token from "./Token";
import type Node from "./Node";
import TokenType from "./TokenType";
import Type from "./Type";
import Unparsable from "./Unparsable";
import { TYPE_SYMBOL } from "../parser/Tokenizer";
import NeverType from "./NeverType";
import { getPossibleTypes } from "./getPossibleTypes";
import { Position } from "./Node";
import type Transform from "./Replacement"

export default class UnionType extends Type {

    readonly left: Type;
    readonly or: Token;
    readonly right: Type | Unparsable;

    constructor(left: Type, right: Type | Unparsable, or?: Token) {
        super();

        this.left = left;
        this.or = or ?? new Token(TYPE_SYMBOL, [ TokenType.UNION ]);
        this.right = right;
    }

    computeChildren() {
        return [ this.left, this.or, this.right ];
    }

    accepts(type: Type, context: Context): boolean {
        return this.left.accepts(type, context) || (!(this.right instanceof Type) || this.right.accepts(type, context));
    }

    getConversion(context: Context, input: Type, output: Type): ConversionDefinition | undefined {
        const left = context.native?.getConversion(this.left.getNativeTypeName(), context, input, output);
        if(left !== undefined) return left;
        return this.right instanceof Type ? context.native?.getConversion(this.right.getNativeTypeName(), context, input, output) : undefined;
    }

    getFunction(context: Context, name: string): FunctionDefinition | undefined {
        const left = context.native?.getFunction(this.left.getNativeTypeName(), name);
        if(left !== undefined) return left;
        return this.right instanceof Type ? context.native?.getFunction(this.right.getNativeTypeName(), name) : undefined;
    }

    getNativeTypeName(): string { return "union"; }

    clone(original?: Node, replacement?: Node) { 
        return new UnionType(
            this.left.cloneOrReplace([ Type ], original, replacement), 
            this.right.cloneOrReplace([ Type, Unparsable ], original, replacement), 
            this.or.cloneOrReplace([ Token ], original, replacement)
        ) as this; 
    }

    computeConflicts() {}

    getTypes(context: Context): TypeSet {
        // Return the union of the left and right type sets.
        return (this.left instanceof UnionType ? this.left.getTypes(context) : new TypeSet([ this.left ], context))
            .union(
                this.right instanceof UnionType ? this.right.getTypes(context) : new TypeSet(this.right instanceof Unparsable ? [] : [ this.right ], context),
                context
            );
    }
    
    getDescriptions() {
        return {
            eng: "One of these types"
        }
    }

    getChildReplacements(child: Node, context: Context, position: Position): Transform[]  {

        if(position === Position.ON) {
            if(child === this.left || child === this.right)
                return getPossibleTypes(this, context);
        }
        else if(position === Position.BEFORE) {
            if(child === this.right)
                // TODO Suggest replacing the right with a union with the right as the right and a type placeholder as the left.
                return []

        }
        else if(position === Position.END) {
            // TODO Suggest replacing the right with a new union type with the right as the left and a new right placeholder
        }
        
        return [];

    }

}

/** Given a list of types, remove all duplicates, and if only one remains, return it.
 *  Otherwise, create a union type that contains all of the unique types.
 */
export function getPossibleUnionType(context: Context, types: Type[]): Type | undefined {

    if(types.length === 0) return undefined;

    const uniqueTypes: Type[] = [];
    types.forEach(type => {
        if(uniqueTypes.length === 0 || uniqueTypes.every(t => !t.accepts(type, context)))
            uniqueTypes.push(type);
    })

    // If there's just one, return it.
    if(uniqueTypes.length === 1)
        return uniqueTypes[0];

    // Otherwise construct a nested union type of all of them.
    let union = uniqueTypes[0];
    do {
        uniqueTypes.shift();
        if(uniqueTypes.length > 0)
            union = new UnionType(union, uniqueTypes[0]);
    } while(uniqueTypes.length > 0);
    return union;
    
}

/**
 * Utility class for reasoning about sets of types. Guarantees that any given pair of types in the set
 * are not compatible.
 */
export class TypeSet {

    readonly set = new Set<Type>();

    constructor(types: Type[], context: Context) {

        // Remove any duplicates.
        for(const type of types)
            if(Array.from(this.set).find(t => t.accepts(type, context)) === undefined)
                this.set.add(type);

    }

    list() { return Array.from(this.set); }

    contains(type: Type, context: Context): boolean {
        return this.list().find(t => t.accepts(type, context)) !== undefined;
    }

    union(set: TypeSet, context: Context) {
        return new TypeSet([ ...this.list(), ...set.list() ], context);
    }

    difference(set: TypeSet, context: Context) {
        return new TypeSet(
            this.list().filter(thisType => set.list().find(thatType => thatType.accepts(thisType, context)) === undefined),
            context
        );
    }

    intersection(set: TypeSet, context: Context) {
        return new TypeSet(this.list().filter(thisType => set.list().find(thatType => thatType.accepts(thisType, context)) !== undefined), context);
    }

    /**
     * Converts type set into a single Type, UnionType, or NeverType (if set is empty).,
     */
    type() {
        if(this.set.size === 1)
            return this.list()[0];

        let types = this.list();
        let cur = types.shift();
        let next = types.shift();
        let union = undefined;
        if(cur !== undefined && next !== undefined)
            union = new UnionType(cur, next);
        while(types.length > 0 && union !== undefined) {
            let next = types.shift();
            if(next !== undefined)
                union = new UnionType(union, next);
        }
        return union === undefined ? new NeverType() : union;

    }

}