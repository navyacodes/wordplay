import toStructure from '../basis/toStructure';
import { TYPE_SYMBOL } from '@parser/Symbols';
import type Value from '@runtime/Value';
import { getBind } from '@locale/getBind';
import Output from './Output';
import type RenderContext from './RenderContext';
import type Place from './Place';
import type TypeOutput from './TypeOutput';
import type Locale from '../locale/Locale';

export function createArrangementType(locales: Locale[]) {
    return toStructure(`
    ${getBind(locales, (locale) => locale.output.Arrangement, TYPE_SYMBOL)}()
`);
}

export default abstract class Arrangement extends Output {
    constructor(value: Value) {
        super(value);
    }

    /** Compute positions for all subgroups in the group. */
    abstract getLayout(
        output: (TypeOutput | null)[],
        context: RenderContext
    ): {
        left: number;
        top: number;
        right: number;
        bottom: number;
        width: number;
        height: number;
        places: [TypeOutput, Place][];
    };

    abstract getDescription(
        output: (TypeOutput | null)[],
        locales: Locale[]
    ): string;
}
