<script module lang="ts">
    export const Limit = 10;
</script>

<script lang="ts">
    import { locales } from '@db/Database';
    import { type Snippet } from 'svelte';
    import Concept from '../../concepts/Concept';
    import type BasisCharacter from '../../lore/BasisCharacter';
    import Emotion from '../../lore/Emotion';
    import { withColorEmoji } from '../../unicode/emoji';
    import ConceptLinkUI from '../concepts/ConceptLinkUI.svelte';
    import Eyes from './Eyes.svelte';

    interface Props {
        character: BasisCharacter | Concept;
        /** If true, speech is placed below character. If false, speech is placed to the right or left of character. */
        below?: boolean;
        /** If true and speech is not below, reading order is flipped. */
        flip?: boolean;
        /** If true and speech is not below, baseline aligns the character and speech */
        baseline?: boolean;
        /** If true, uses foreground color for background, and background for foreground. */
        invert?: boolean;
        /** If true, sets height of speech to 100% and scrolls it */
        scroll?: boolean;
        /** Optional emotion */
        emotion?: Emotion | undefined;
        /** Optionally turn off animation */
        emote?: boolean;
        /** Optionally double size of text */
        big?: boolean;
        aside?: Snippet;
        content: Snippet;
    }

    let {
        character,
        below = false,
        flip = false,
        baseline = false,
        invert = false,
        scroll = true,
        emotion = undefined,
        emote = true,
        big = false,
        aside,
        content,
    }: Props = $props();

    let renderedEmotion = $derived(
        emotion ??
            (character instanceof Concept
                ? character?.getEmotion($locales)
                : undefined),
    );

    let characters = $derived(
        character instanceof Concept
            ? character.getCharacter($locales).symbols
            : character.symbols,
    );

    let symbols = $derived(
        withColorEmoji(
            characters.length > Limit
                ? `${characters.substring(0, Limit)}…`
                : characters,
        ),
    );
</script>

<div
    class="dialog {below
        ? flip
            ? 'column reverse'
            : 'column'
        : flip
          ? 'row reverse'
          : 'row'} {!below && baseline ? 'baseline' : ''}"
    class:big
    class:scroll
>
    <div class="speaker">
        <div
            class="characters {symbols.length >= 3
                ? 'small'
                : ''} {renderedEmotion && emote
                ? `emotion-${renderedEmotion}`
                : ''}"
        >
            {#if character instanceof Concept}
                <ConceptLinkUI link={character} label={symbols} />
            {:else}
                {symbols}
            {/if}
            <Eyes {invert} emotion={emotion ?? Emotion.neutral} />
        </div>{@render aside?.()}
    </div>
    <div
        class="message {below
            ? flip
                ? 'below flip'
                : 'below'
            : flip
              ? 'flip'
              : 'reading'} {typeof document !== 'undefined'
            ? document.documentElement.dir
            : 'ltr'}"
    >
        {#if scroll}
            <div class="scroller">{@render content()}</div>
        {:else}
            {@render content()}
        {/if}
    </div>
</div>

<style>
    .dialog {
        display: flex;
        flex-wrap: nowrap;
        gap: var(--wordplay-spacing);
    }

    .dialog.big {
        font-size: 125%;
    }

    .dialog.scroll {
        max-height: 100%;
    }

    .dialog.column {
        flex-direction: column;
        align-items: start;
    }

    .dialog.row {
        flex-direction: row;
        align-items: center;
        max-width: 100%;
    }

    .dialog.row {
        flex-direction: row;
        align-items: center;
        max-width: 100%;
    }

    .dialog.column.reverse {
        align-items: flex-end;
        padding-inline-start: calc(2 * var(--wordplay-spacing));
    }

    .dialog.row.reverse {
        flex-direction: row-reverse;
    }

    .dialog.row.baseline {
        align-items: baseline;
    }

    .characters {
        display: inline-block;
        line-height: 100%;
        font-family: var(--wordplay-code-font);
        position: relative;
        margin-right: auto;
        font-size: 2em;
    }

    .characters.small {
        font-size: 1em;
    }

    .row .characters {
        max-width: 4em;
        flex-shrink: 0;
        text-align: center;
        word-break: break-all;
    }

    .scroller {
        overflow: auto;
        width: 100%;
        height: 100%;
    }

    .message {
        border: var(--wordplay-border-width) solid var(--wordplay-border-color);
        border-radius: calc(2 * var(--wordplay-border-radius));
        align-self: stretch;
        position: relative;
        background: var(--wordplay-background);
        color: var(--wordplay-foreground);
        flex-grow: 1;
        --tail-width: 0.25em;
        --direction: 1;
        max-height: 100%;
        padding: var(--wordplay-spacing);
    }

    .message.rtl {
        --direction: -1;
    }

    .message.reading {
        margin-inline-start: var(--tail-width);
    }

    .message.below {
        margin-top: var(--tail-width);
    }

    .message.reading:after {
        content: '';
        position: absolute;
        border-style: solid;
        border-width: var(--tail-width) var(--tail-width) var(--tail-width) 0;
        border-color: transparent var(--wordplay-background);
        display: block;
        width: 0;
        margin-top: calc(-1 * var(--tail-width));
        inset-inline-start: calc(-1 * var(--tail-width));
        top: 50%;
    }

    .message.reading.rtl:after {
        border-width: var(--tail-width) 0 var(--tail-width) var(--tail-width);
    }

    .baseline .message.reading:after {
        top: calc(2 * var(--wordplay-spacing));
    }

    .message.reading:before {
        content: '';
        position: absolute;
        border-style: solid;
        border-width: calc(var(--tail-width) + var(--wordplay-border-width))
            calc(var(--tail-width) + var(--wordplay-border-width))
            calc(var(--tail-width) + var(--wordplay-border-width)) 0;
        border-color: transparent var(--wordplay-border-color);
        display: block;
        width: 0;
        margin-top: calc(
            -1 * (var(--tail-width) + var(--wordplay-border-width))
        );
        inset-inline-start: calc(
            -1 * (var(--tail-width) + 1 * var(--wordplay-border-width))
        );
        top: 50%;
    }

    .message.reading.rtl:before {
        border-width: calc(var(--tail-width) + var(--wordplay-border-width)) 0
            calc(var(--tail-width) + var(--wordplay-border-width))
            calc(var(--tail-width) + var(--wordplay-border-width));
    }

    .baseline .message.reading:before {
        top: calc(2 * var(--wordplay-spacing));
    }

    .message.flip:before {
        content: '';
        position: absolute;
        border-style: solid;
        border-width: calc(var(--tail-width) + var(--wordplay-border-width)) 0
            calc(var(--tail-width) + var(--wordplay-border-width))
            calc(var(--tail-width) + var(--wordplay-border-width));
        border-color: transparent var(--wordplay-border-color);
        display: block;
        width: 0;
        margin-top: calc(
            -1 * (var(--tail-width) + var(--wordplay-border-width))
        );
        inset-inline-end: calc(
            var(--direction) * -1 *
                (var(--tail-width) + 1 * var(--wordplay-border-width))
        );
        top: 50%;
    }

    .message.flip:after {
        content: '';
        position: absolute;
        border-style: solid;
        border-width: var(--tail-width) 0 var(--tail-width) var(--tail-width);
        border-color: transparent var(--wordplay-background);
        display: block;
        width: 0;
        margin-top: calc(-1 * var(--tail-width));
        inset-inline-end: calc(-1 * var(--direction) * var(--tail-width));
        top: 50%;
    }

    .baseline .message.flip:after {
        top: calc(2 * var(--wordplay-spacing));
    }

    .baseline .message.flip:before {
        top: calc(2 * var(--wordplay-spacing));
    }

    .message.below:before {
        content: '';
        position: absolute;
        border-style: solid;
        border-width: 0 calc(var(--tail-width) + var(--wordplay-border-width))
            calc(var(--tail-width) + var(--wordplay-border-width));
        border-color: var(--wordplay-border-color) transparent;
        display: block;
        width: 0;
        top: calc(-1 * (var(--tail-width) + var(--wordplay-border-width)));
        inset-inline-start: calc(
            2 * var(--tail-width) - 1 * var(--wordplay-border-width)
        );
    }

    .message.below:after {
        content: '';
        position: absolute;
        border-style: solid;
        border-width: 0 var(--tail-width) var(--tail-width);
        border-color: var(--wordplay-background) transparent;
        display: block;
        width: 0;
        top: calc(-1 * var(--tail-width));
        inset-inline-start: calc(2 * var(--tail-width));
    }

    .message.below.flip:before {
        content: '';
        position: absolute;
        border-style: solid;
        border-width: 0 calc(var(--tail-width) + var(--wordplay-border-width))
            calc(var(--tail-width) + var(--wordplay-border-width));
        border-color: var(--wordplay-border-color) transparent;
        display: block;
        width: 0;
        top: 0;
        inset-inline-start: calc(
            100% - 5 * var(--tail-width) - 1 * var(--wordplay-border-width)
        );
    }

    .message.below.flip:after {
        content: '';
        position: absolute;
        border-style: solid;
        border-width: 0 var(--tail-width) var(--tail-width);
        border-color: var(--wordplay-background) transparent;
        display: block;
        width: 0;
        top: 0;
        inset-inline-start: calc(100% - 5 * var(--tail-width));
    }

    .emotion-kind {
        animation: kind ease 1;
        animation-duration: 0.5s;
        transform-origin: bottom;
    }

    @keyframes kind {
        0% {
            transform: rotate(3deg);
            transform-origin: bottom;
        }
        30% {
            transform: rotate(-3deg);
            transform-origin: bottom;
        }
        100% {
            transform: rotate(7deg) scaleY(0.9) translateX(0.1em);
            transform-origin: bottom;
        }
    }

    .emotion-serious {
        animation: serious ease 3;
        animation-duration: 0.25s;
        transform-origin: bottom;
    }

    @keyframes serious {
        0% {
            transform: scaleY(1);
        }
        10%,
        70% {
            transform: scaleY(0.9);
        }
        100% {
            transform: scaleY(1);
        }
    }

    .emotion-cheerful {
        animation: cheerful ease-in-out infinite;
        animation-duration: 2s;
        transform-origin: bottom;
        --cheerfulness: 1deg;
    }

    @keyframes cheerful {
        0%,
        100% {
            transform: rotate(calc(-1 * var(--cheerfulness)))
                skewX(calc(-1 * var(--cheerfulness))) translateX(-3px)
                rotate(-10deg);
        }
        50% {
            transform: rotate(var(--cheerfulness)) skewX(var(--cheerfulness))
                translateX(3px) rotate(10deg);
        }
    }

    .emotion-bored {
        animation: bored ease infinite;
        animation-duration: 2s;
        transform-origin: bottom;
    }

    @keyframes bored {
        0%,
        50%,
        100% {
            transform: scaleY(1);
        }
        25% {
            transform: scaleY(0.7) skewX(-20deg);
        }
        75% {
            transform: scaleY(0.7) skewX(20deg);
        }
    }

    .emotion-curious {
        animation: curious ease infinite;
        animation-duration: 2s;
        transform-origin: bottom;
    }

    @keyframes curious {
        0%,
        40%,
        100% {
            transform: rotate(0deg);
        }
        80% {
            transform: rotate(10deg);
        }
    }

    .emotion-eager {
        animation: eager ease infinite;
        animation-duration: 1s;
        transform-origin: bottom;
    }

    @keyframes eager {
        0% {
            transform: scaleY(1) translateY(0);
        }
        10% {
            transform: scaleY(0.9) translateY(0);
        }
        30% {
            transform: scaleY(1.1) translateY(calc(-1 * var(--bounce-height)));
        }
        50% {
            transform: scaleY(0.95) translateY(0);
        }
        57% {
            transform: scaleY(1) translateY(-7px);
        }
        64% {
            transform: scaleY(1) translateY(0);
        }
        100% {
            transform: scaleY(1) translateY(0);
        }
    }

    .emotion-scared {
        animation: scared linear infinite;
        animation-duration: 100ms;
        transform-origin: center;
    }

    @keyframes scared {
        0% {
            transform: scaleY(1) rotate(-2deg);
        }
        15% {
            transform: scaleY(0.9) rotate(3deg);
        }
        30% {
            transform: scaleY(1.1) rotate(-9deg);
        }
        45% {
            transform: scaleY(0.95) rotate(0);
        }
        60% {
            transform: scaleY(1) rotate(-7deg);
        }
        75% {
            transform: scaleY(1) rotate(0);
        }
        90% {
            transform: scaleY(1) rotate(3deg);
        }
    }

    .emotion-angry {
        animation: angry linear infinite;
        animation-duration: 25ms;
        transform-origin: center;
    }

    @keyframes angry {
        0% {
            transform: translateY(-1px);
        }
        50% {
            transform: scale(1.3) translateY(2px);
        }
        90% {
            transform: translateY(-1px);
        }
    }

    .emotion-arrogant {
        animation: arrogant ease-out infinite;
        animation-duration: 5s;
        transform-origin: bottom;
    }

    @keyframes arrogant {
        0%,
        100% {
            transform: rotate(0deg) skewX(5deg);
        }
        25% {
            transform: rotate(15deg);
        }
        75% {
            transform: rotate(10deg) skewX(3deg);
        }
    }

    .emotion-confused {
        animation: confused ease infinite;
        animation-duration: 2s;
        transform-origin: bottom;
    }

    @keyframes confused {
        0%,
        100% {
            transform: rotate(0deg);
        }
        25% {
            transform: rotate(5deg);
        }
        50% {
            transform: rotate(5deg) scaleY(1.2);
        }
        75% {
            transform: rotate(5deg) scaleY(1.2);
        }
    }

    .emotion-excited {
        animation: excited ease-out infinite;
        animation-duration: 500ms;
        transform-origin: bottom;
    }

    @keyframes excited {
        0%,
        100% {
            transform: scaleX(1);
        }
        50% {
            transform: scaleX(-1) translateY(-10px);
        }
    }

    .emotion-grumpy {
        animation: grumpy ease-out infinite;
        animation-duration: 5s;
        transform-origin: bottom;
    }

    @keyframes grumpy {
        0%,
        100% {
            transform: none;
        }
        25% {
            transform: scaleY(0.5);
        }
        85% {
            transform: scaleY(0.6);
        }
        95% {
            transform: scaleY(0.9);
        }
    }

    .emotion-happy {
        animation: happy ease-out infinite;
        animation-duration: 4s;
        transform-origin: bottom;
    }

    @keyframes happy {
        0%,
        100% {
            transform: rotate(0deg);
        }
        25% {
            transform: rotate(10deg);
        }
        85% {
            transform: rotate(10deg);
        }
        95% {
            transform: rotate(5deg);
        }
    }

    .emotion-insecure {
        animation: insecure ease-out infinite;
        animation-duration: 4s;
        transform-origin: bottom;
    }

    @keyframes insecure {
        0%,
        100% {
            transform: scale(0.8);
        }
        25% {
            transform: scale(0.4) translate(-5px);
        }
        50% {
            transform: scale(0.4) translate(8px);
        }
        90% {
            transform: scale(0.6) translate(-3px);
        }
    }

    .emotion-neutral {
        animation: neutral ease-out infinite;
        animation-duration: 4s;
        transform-origin: bottom;
    }

    @keyframes neutral {
        0%,
        100% {
            transform: translateX(0);
        }
        25% {
            transform: translateX(-2px);
        }
        50% {
            transform: translateX(3px) rotate(5deg);
        }
        90% {
            transform: translateX(4px) rotate(7deg);
        }
    }

    .emotion-sad {
        animation: sad ease-in infinite;
        animation-duration: 2s;
        transform-origin: bottom;
    }

    @keyframes sad {
        0%,
        100% {
            transform: scaleY(1);
        }
        5% {
            transform: scaleY(0.5) rotate(5deg);
        }
        10% {
            transform: scaleY(0.9);
        }
        15% {
            transform: scaleY(0.5) rotate(-5deg);
        }
        20% {
            transform: scaleY(0.8);
        }
        25% {
            transform: scaleY(0.5) rotate(5deg);
        }
        30% {
            transform: scaleY(0.7);
        }
        35% {
            transform: scaleY(0.5) rotate(5deg);
        }
        40% {
            transform: scaleY(0.6);
        }
        45% {
            transform: scaleY(0.5) rotate(-5deg);
        }
        90% {
            transform: scaleY(0.5);
        }
    }

    .emotion-surprised {
        animation: surprised ease-out infinite;
        animation-duration: 2s;
        transform-origin: bottom;
    }

    @keyframes surprised {
        0%,
        100% {
            transform: scale(1);
        }
        5% {
            transform: scale(1.2);
        }
        25% {
            transform: scale(1.4);
        }
        90% {
            transform: scale(1.3);
        }
    }

    .emotion-precise {
        animation: precise steps(2) infinite;
        animation-duration: 1s;
        transform-origin: bottom;
    }

    @keyframes precise {
        0% {
            transform: translate(-10px, -10px);
        }
        25% {
            transform: translate(-10px, 10px);
        }
        50% {
            transform: translate(10px, 10px);
        }
        75% {
            transform: translate(10px, -10px);
        }
        100% {
            transform: translate(-10px, -10px);
        }
    }

    .emotion-shy {
        animation-name: shy;
        animation-iteration-count: 1;
        animation-duration: 3s;
        transform-origin: bottom;
        animation-fill-mode: forwards;
    }

    @keyframes shy {
        0% {
            transform: scale(1);
        }
        50% {
            transform: scale(0.85);
        }
        100% {
            transform: scale(0.75);
        }
    }

    .speaker {
        display: flex;
        flex-direction: row;
        gap: var(--wordplay-spacing);
    }
</style>
