import Node from "./Node";
import type Borrow from "./Borrow";
import type Unparsable from "./Unparsable";
import type Conflict from "../parser/Conflict";
import type Expression from "./Expression";
import type TypeVariable from "./TypeVariable";
import type Block from "../nodes/Block";
import type Bind from "../nodes/Bind";
import type Evaluator from "../runtime/Evaluator";
import type Value from "../runtime/Value";
import type Evaluable from "../runtime/Evaluable";
import type Step from "../runtime/Step";
import Finish from "../runtime/Finish";
import Start from "../runtime/Start";

export default class Program extends Node implements Evaluable {
    
    readonly borrows: (Borrow | Unparsable)[];
    readonly block: Block | Unparsable;

    constructor(borrows: (Borrow|Unparsable)[], block: Block | Unparsable) {

        super();

        this.borrows = borrows.slice();
        this.block = block;
    }

    isBindingEnclosureOfChild(child: Node): boolean { return child === this.block; }

    getChildren() { return [ ...this.borrows, this.block ]; }
    getConflicts(program: Program): Conflict[] { return []; }

    getDefinition(program: Program, node: Node, name: string): Bind | TypeVariable | Expression | undefined {
        // TODO: We don't yet have a repository of imports, built-in or otherwise.
        return undefined;
    }
    
    getBindingEnclosureOf(node: Node): Node | undefined {
        const ancestors = this.getAncestorsOf(node);
        
        // Keep searching for an ancestor that's a binding 
        // If the parent is not a binding enclosure of the specific child, then skip the parent.
        if(ancestors && ancestors.length > 0) {
            let child = node;
            let parent = ancestors.shift();
            do {
                if(parent !== undefined) {
                    // Is this parent a binding enclosure if it's child? Return it!
                    if(parent.isBindingEnclosureOfChild(child))
                        return parent;
                    // If not, the child becomes the parent and we get the parent's parent.
                    child = parent;
                    parent = ancestors.shift();
                }
            } while(parent !== undefined && ancestors.length > 0);
        }

    }

    compile(): Step[] {
        // Execute the borrows, then the block, then this.
        return [ 
            new Start(this),
            ...this.borrows.reduce((steps: Step[], borrow) => [...steps, ...borrow.compile()], []),
            ...this.block.compile(),
            new Finish(this)            
        ];
    }

    evaluate(evaluator: Evaluator) {

        // Return whatever the block computed.
        return evaluator.popValue();

    }

}