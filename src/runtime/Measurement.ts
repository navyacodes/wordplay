import Token, { TokenType } from "../nodes/Token";
import Unit from "../nodes/Unit";
import Bool from "./Bool";
import Exception, { ExceptionType } from "./Exception";
import Value from "./Value";

/** A decimal number with a unit.
 * If all of it's parts are empty, it is not a number.
 * If it's numerator 
 */
export default class Measurement extends Value {

    /** True if the number is positive, false if negative */
    readonly positive: boolean;

    /** The integer part */
    readonly digits: number[];

    /** The fractional, irrational part */
    readonly exponent: number;

    /** The numerator of the rational part */
    readonly numerator: number[];

    /** The denominator of the rational part */
    readonly denominator: number[];

    readonly unit: Unit;

    constructor(number: number | Token | [ boolean, number[], number, number[], number[] ], unit?: Unit) {
        super();

        // If it's an array of parts, just assign them
        if(Array.isArray(number) && number.length === 5) {
            this.positive = number[0];
            this.digits = number[1];
            this.exponent = number[2];
            this.numerator = number[3];
            this.denominator = number[4];
        }
        // If it's a token, convert the string.
        else if(number instanceof Token) {
            if(number.is(TokenType.DECIMAL)) {
                // Remove zeros on the front until reaching a digit or the decimal point.
                let digits = number.text;
                while(digits.charAt(0) === "0" && digits.length > 1 && digits.charAt(0) !== ".") 
                    digits = digits.substring(1);
                // If this has a decimal point, remove trailing zeroes until reaching it or a non-zero digit.
                if(digits.indexOf(".") >= 0)
                    while(digits.charAt(digits.length - 1) === "0" && digits.charAt(digits.length - 1) !== ".") 
                        digits = digits.substring(0, digits.length - 2);
                // Split into the two halves.
                const [ integral, fractional ] = digits.split(".");
                // All measurements from tokens start positive. We don't tokenize negative ones.
                this.positive = true;
                // Combine the digits without the decimal point.
                this.digits = String(integral + (fractional ?? "")).split("").map(s => Number(s));
                // The exponent 
                this.exponent = -(fractional === undefined ? 0 : fractional.length);
                // Adjust exponent to remove trailing zero digits.
                while(this.digits[this.digits.length - 1] === 0) {
                    this.digits.pop();
                    this.exponent++;
                }
                // No fraction initially.
                this.numerator = [];
                this.denominator = [];
            }
            else if(number.is(TokenType.PI)) {
                this.positive = true;
                this.digits = [ 3, 1,4,1,5,9, 2,6,5,3,5, 8,9,7,9,3, 2,3,8,4,6, 2,6,4,3,3, 8,3,2,7,9, 5,0,2,8,8, 4,1,9,7,1, 6,9,3,9,9, 3,7,5,1,0 ];
                this.exponent = -50;
                this.numerator = [];
                this.denominator = [];
            }
            else {
            // else if(number.is(TokenType.JAPANESE)) {
            // else if(number.is(TokenType.INFINITY)) {
                // TODO
                this.positive = true;
                this.digits = [];
                this.exponent = 0;
                this.numerator = [];
                this.denominator = [];
            }
        }
        // If it's a Javascript floating point, convert.
        else if(typeof number === "number") {
            const [ integral, fractional ] = Math.abs(number).toLocaleString('en-US', { useGrouping: false, maximumFractionDigits: 20 }).split(".");
            this.positive = number >= 0;
            this.digits = [ ...integral.split("").map(s => Number(s)), ...(fractional === undefined ? [] : fractional.split("").map(s => Number(s))) ];
            this.exponent = -(fractional === undefined ? 0 : fractional.length);
            while(this.digits[this.digits.length - 1] === 0) {
                this.digits.pop();
                this.exponent++;
            }
            this.numerator = [];
            this.denominator = [];
        }
        else {
            this.positive = true;
            this.digits = [];
            this.exponent = 0;
            this.numerator = [];
            this.denominator = [];
        }

        const invalidDigit = this.digits.find(n => isNaN(n) || !Number.isInteger(n) || n < 0 || n > 9);
        if(invalidDigit !== undefined) 
            console.error(`Invalid digit: ${invalidDigit}`);

        this.unit = unit === undefined ? new Unit([], []) : unit;
    }

    isNotANumber() { return this.digits.length === 0 && this.numerator.length === 0 && this.denominator.length === 0; }

    // TODO Check the integer part once we implement it.
    isInteger() { return this.exponent === this.digits.length && this.numerator.length === 0; }

    toNumber(): number { 
        
        if(this.isNotANumber()) return NaN;

        const float = Number(`${this.digits.slice(0, this.exponent).join("")}.${this.digits.slice(this.exponent).join}`);
        const rational = Number(this.numerator.join("")) / Number(this.denominator.join(""));
        return isNaN(float) ? NaN : isNaN(rational) ? NaN : float + rational;

    }

    evaluatePrefix(operator: string) {

        switch(operator) {
            case "-": return new Measurement([ !this.positive, this.digits, this.exponent, this.numerator, this.denominator ] , this.unit);
            // TODO Fix the unit on square roots.
            case "√": return new Measurement(Math.sqrt(this.toNumber()), this.unit);
            default: return new Exception(ExceptionType.UNKNOWN_OPERATOR);
        }

    }

    evaluateInfix(operator: string, right: Value) {

        if(!(right instanceof Measurement)) 
            return new Exception(ExceptionType.EXPECTED_TYPE);
    
        switch(operator) {
            case "+":
                return this.unit.toString() === right.unit.toString() ?
                    this.add(right) :
                    new Exception(ExceptionType.EXPECTED_TYPE)
            case "-":
                return this.unit.toString() === right.unit.toString() ?
                    this.subtract(right) :
                    new Exception(ExceptionType.EXPECTED_TYPE)
            case "×":
            case "*":
            case "·": return this.multiply(right);
            case "÷": return this.divide(right);
            case "%": return this.remainder(right);
            // TODO Implement
            case "^":
            case "<": return this.lessThan(right);
            case ">": return this.greaterThan(right);
            case "≤": return this.lessThan(right) || this.equals(right);
            case "≥": return this.greaterThan(right) || this.equals(right);
            case "=": return this.equals(right);
            case "≠": return !this.equals(right);
            default: return new Exception(ExceptionType.UNKNOWN_OPERATOR);
        }

    }

    static addDigits(top: number[], bottom: number[]): number[] {

        while(top.length < bottom.length)
            top.unshift(0);
        while(bottom.length < top.length)
            bottom.unshift(0);

        let carry = 0;
        let digits: number[] = [];
        for(let position = top.length - 1; position >= 0; position--) {
            const topDigit = top[position];
            const bottomDigit = bottom[position];
            const sum: number = topDigit + bottomDigit + carry;
            const remainder = sum % 10;
            carry = (sum - remainder) / 10;
            digits.unshift(remainder);
        }
        if(carry > 0)
            digits.unshift(carry);

        return digits;

    }

    static subtractDigits(top: number[], bottom: number[]): number[] {

        while(top.length < bottom.length)
            top.unshift(0);
        while(bottom.length < top.length)
            bottom.unshift(0);

        let borrow = false;
        let digits: number[] = [];
        for(let position = top.length - 1; position >= 0; position--) {
            let topDigit = top[position];
            let bottomDigit = bottom[position];
            // Handle the previous loop's borrow.
            if(borrow) {
                // Propagate the borrow if this digit is zero.
                if(topDigit === 0) {
                    topDigit = 9;
                    borrow = true;
                }
                // If it's not, just decrease the top digit by one.
                else {
                    topDigit--;
                    borrow = false;
                }
            } 
            // If the top digit is still less than the bottom, borrow again and add 10.
            if(topDigit < bottomDigit) {
                topDigit += 10;
                borrow = true;
            }
            digits.unshift(topDigit - bottomDigit);
        }

        while(digits[0] === 0 && digits.length > 1) 
            digits.shift();
        return digits;

    }

    negate(): Measurement {
        return new Measurement([!this.positive, this.digits, this.exponent, this.numerator, this.denominator ], this.unit);
    }

    absolute(): Measurement {
        return new Measurement([true, this.digits, this.exponent, this.numerator, this.denominator ], this.unit);
    }

    add(operand: Measurement): Measurement {

        // If this is positive...
        if(this.positive) {
            // And the operand is negative, subtract it's negation from this.
            if(!operand.positive)
                return this.subtract(operand.negate());
        }
        // If this is negative...
        else {
            // ... but the operand is positive, negate this, subtract the operand from it, then negate the result
            if(operand.positive)
                return this.negate().subtract(operand).negate();
        }
        // Otherwise, if they have the same sign, we just add the digits and keep the sign.

        // Align the exponents.
        let [ thisDigits, thatDigits, newExponent ] = Measurement.align(this, operand);

        // Add the digits.
        const newDigits = Measurement.addDigits(thisDigits, thatDigits);

        // While there are trailing zeroes, remove them, normalizing.
        while(newDigits[newDigits.length - 1] === 0) {
            newDigits.pop();
            newExponent++;
        }

        // Add the ratios
        // TODO

        // Return modified ratios
        return new Measurement([this.positive, newDigits, newExponent, this.numerator, this.denominator], this.unit);

    }

    static align(left: Measurement, right: Measurement): [ number[], number[], number ] {

        // 1. Prepare some digits for adding. Copy them since we will mutate them.
        const leftDigits = left.digits.slice();
        const rightDigits = right.digits.slice();

        // 2. Which operand has the lower exponent?
        const leftExponentIsLower = left.exponent < right.exponent;
        const largerExponentsDigits = leftExponentIsLower ? rightDigits: leftDigits;
        let newExponent = leftExponentIsLower ? left.exponent : right.exponent;
        let exponentDifference = Math.abs(left.exponent - right.exponent);

        // 3. Pad the smaller digit's with zeroes on the right to align their exponents.
        while(exponentDifference > 0) {
            largerExponentsDigits.push(0);
            exponentDifference--;
        }

        return [ leftDigits, rightDigits, newExponent ];

    }

    subtract(operand: Measurement): Measurement {

        // The code below only knows how to subtract larger from smaller numbers, so we flip and negate in this case.
        if(this.absolute().lessThan(operand.absolute()).bool)
            return operand.subtract(this).negate();

        // Align the exponents
        let [ thisDigits, thatDigits, newExponent ] = Measurement.align(this, operand);

        // Now that the exponents are aligned, add the digits.
        const newDigits = Measurement.subtractDigits(thisDigits, thatDigits);

        // While there are trailing zeroes, remove them 
        while(newDigits[newDigits.length - 1] === 0) {
            newDigits.pop();
            newExponent++;
        }
        
        return new Measurement([ this.positive, newDigits, newExponent, this.numerator, this.denominator ], this.unit);

    }

    multiply(operand: Measurement): Measurement {

        return this;
        // return new Measurement([], 
        //     new Unit(
        //         this.unit.numerator.concat(operand.unit.numerator),
        //         this.unit.denominator.concat(operand.unit.denominator)
        //     )
        // );

    }

    divide(operand: Measurement): Measurement {

        return this;
        // return new Measurement([], 
        //     new Unit(
        //         this.unit.numerator.concat(operand.unit.numerator),
        //         this.unit.denominator.concat(operand.unit.denominator)
        //     )
        // );

    }

    remainder(perand: Measurement): Measurement {
        return this;
        // return new Measurement([], this.unit);
    }

    /** Equal if all of their parts are equal. */
    equals(operand: Measurement): Bool {

        return new Bool(
            this.positive === operand.positive &&
            this.digits.join("") === operand.digits.join("") &&
            this.exponent === this.exponent &&
            this.numerator.join("") == operand.numerator.join("") &&
            this.denominator.join("") == operand.denominator.join("")
        );
        
    }

    greaterThan(operand: Measurement): Bool {

        // Just reuse the less than code below by flipping the operands.
        return operand.lessThan(this);
        
    }

    lessThan(operand: Measurement): Bool {

        // If they have different signs, it's easy.
        if(this.positive && !operand.positive) return new Bool(false);
        if(!this.positive && operand.positive) return new Bool(true);

        // If they share a sign, align the exponents to make digits comparable.
        let [ thisDigits, thatDigits, newExponent ] = Measurement.align(this, operand);

        // If they have different digit lengths, it's easy; account for signs by flipping the result if negative.
        if(thisDigits.length < thatDigits.length) return new Bool(this.positive);
        if(thisDigits.length > thatDigits.length) return new Bool(!this.positive);

        // If they have the same number digits, compare the digits from most to least signficant.
        for(let i = 0; i < thisDigits.length; i++) {
            if(thisDigits[i] < thatDigits[i]) return new Bool(this.positive);
            if(thisDigits[i] > thatDigits[i]) return new Bool(!this.positive);
        }

        // If they're equal, return false.
        return new Bool(false);
        
    }

    // 182 -1 -> 182
    // 5 -5 -> 00005
    // 33 -5 -> 00033
    // 7 5 -> 700000
    // 1719 -3 -> 1719
    // 12 3 -> 12000
    static padZeros(digits: number[], position: number) {
        digits = digits.slice();
        if(position < 0) {
            let count = -position - digits.length;
            while(count > 0) {
                digits.unshift(0);
                count--;
            }
        }
        else if(position > 0) {
            let count = position - digits.length + 1
            while(count > 0) {
                digits.push(0);
                count--;
            }
        }
        return digits;
    }

    toString() { 
        const digits = Measurement.padZeros(this.digits, this.exponent).join("");
        const before = digits.substring(0, this.digits.length + this.exponent);
        const after = digits.substring(this.digits.length + this.exponent);
        const ratio = (this.numerator.length === 0 || this.denominator.length === 0 ? "" : " " + this.numerator.join("") + "/" + this.denominator.join(""));
        const unit = this.unit.toString();
        return `${this.positive ? "" : "-"}${before}${after.length > 0 ? "." : ""}${after}${ratio}${unit}`;
    }

}