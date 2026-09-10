"use client";

import * as RadioGroup from "@radix-ui/react-radio-group";

/**
 * S03 조건 입력 선택지 — 칩 형태.
 *
 * 화면설계서(`Sairo_화면설계서_08Sep26.pptx`) slide3~4 기준으로 칩이다.
 * 카드보다 촘촘해 한 화면에 7문항이 들어간다.
 *
 * 단일 선택은 Radix `RadioGroup` 을 쓴다 — 칩으로 보여도 의미는 라디오라
 * 화살표 키 이동·roving tabindex·`role="radiogroup"`·`aria-checked` 가 필요하다.
 * 복수 선택은 네이티브 checkbox + `fieldset` 을 쓴다. Radix에 체크박스 *그룹*
 * 프리미티브가 없고(`Checkbox` 는 단일 컨트롤), 브라우저가 그룹 의미와 키보드
 * 동작을 이미 제공한다.
 *
 * 칩에는 설명문을 넣지 않는다. 시트 `option_description` 은 문항 단위 안내로만
 * 쓰고, 선택지에는 `option_label` 만 보인다 (화면설계서와 동일).
 */

/**
 * `chip` — S03. 촘촘해서 한 화면에 7문항이 들어간다. 라벨만 보인다.
 * `row`  — S01. 문항 카드 안에 세로로 쌓이는 행. 라디오 표시가 왼쪽에 온다.
 */
export type ChoiceVariant = "chip" | "row";

/**
 * 선택지 하나. 도메인 타입에 의존하지 않는다 —
 * S01(축 값)과 S03(조건 코드)이 같은 컴포넌트를 쓰기 때문이다.
 */
export type ChoiceOption = {
  /** 선택 시 저장되는 값 */
  value: string;
  label: string;
  /** 지금은 화면에 쓰지 않지만 데이터에는 있다 (시트 option_description) */
  description?: string;
  /** 고르면 같은 문항의 나머지가 전부 해제된다 */
  exclusive?: boolean;
  /** 함께 고를 수 없는 값들. 한쪽에만 적어도 양방향으로 동작한다 */
  conflictsWith?: readonly string[];
};

const itemClass = (variant: ChoiceVariant, selected: boolean) => {
  if (variant === "chip") {
    const fill = selected
      ? "border-ink bg-white text-ink"
      : "border-transparent bg-ds-surface text-gray-600";
    return `ds-body-2 rounded-full border px-4 py-2 transition-all active:scale-[0.97] ${fill}`;
  }

  // row 는 개별 테두리를 두지 않는다 — 문항 카드가 이미 경계를 만든다
  return `ds-body-2 flex min-h-12 w-full items-center gap-3 rounded-lg px-1 py-2 text-left transition-colors ${
    selected ? "text-ink" : "text-gray-600"
  }`;
};

const listClass = (variant: ChoiceVariant) =>
  variant === "chip" ? "flex flex-wrap gap-2" : "flex flex-col";

type BaseProps = {
  /** 문항 제목 요소의 id */
  labelledBy: string;
  options: readonly ChoiceOption[];
  variant?: ChoiceVariant;
};

// === 단일 선택 ===

export function RadioChipGroup({
  labelledBy,
  options,
  value,
  onChange,
  onDeselect,
  variant = "chip",
}: BaseProps & {
  value: string | null;
  onChange: (value: string) => void;
  /** 넘기면 선택된 항목을 다시 눌러 해제할 수 있다 */
  onDeselect?: () => void;
}) {
  return (
    <RadioGroup.Root
      aria-labelledby={labelledBy}
      value={value ?? ""}
      onValueChange={onChange}
      className={listClass(variant)}
    >
      {options.map((option) => {
        const selected = value === option.value;

        return (
          <RadioGroup.Item
            key={option.value}
            value={option.value}
            // Radix는 선택된 항목을 다시 눌러도 onValueChange를 부르지 않는다
            onClick={selected ? onDeselect : undefined}
            className={itemClass(variant, selected)}
          >
            {variant === "row" ? (
              <>
                {/* 피그마 S01 — 라디오 표시가 왼쪽, 라벨만 (설명문 없음) */}
                <span
                  aria-hidden
                  className={`flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                    selected ? "border-ink" : "border-gray-300"
                  }`}
                >
                  <RadioGroup.Indicator className="size-[9px] rounded-full bg-ink" />
                </span>
                <span className="flex-1">{option.label}</span>
              </>
            ) : (
              option.label
            )}
          </RadioGroup.Item>
        );
      })}
    </RadioGroup.Root>
  );
}

// === 복수 선택 ===

export function CheckChipGroup({
  labelledBy,
  options,
  values,
  onChange,
  variant = "chip",
}: BaseProps & {
  values: readonly string[];
  onChange: (values: string[]) => void;
}) {
  /** 화면설계서 §B — 가장 최근에 누른 것을 남기고 충돌하는 기존 선택만 해제한다 */
  const toggle = (option: ChoiceOption) => {
    if (values.includes(option.value)) {
      onChange(values.filter((v) => v !== option.value));
      return;
    }

    if (option.exclusive) {
      onChange([option.value]);
      return;
    }

    const conflicts = new Set<string>(option.conflictsWith ?? []);
    for (const other of options) {
      // `exclusive` 는 나머지 전부와 충돌한다
      if (other.exclusive) conflicts.add(other.value);
      // 반대쪽에만 적혀 있어도 잡는다
      if (other.conflictsWith?.includes(option.value))
        conflicts.add(other.value);
    }

    onChange([...values.filter((v) => !conflicts.has(v)), option.value]);
  };

  return (
    <fieldset aria-labelledby={labelledBy} className={listClass(variant)}>
      {options.map((option) => {
        const selected = values.includes(option.value);

        return (
          <label
            key={option.value}
            className={`${itemClass(variant, selected)} cursor-pointer has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink`}
          >
            {/* 칩 전체가 클릭 영역이다. `sr-only` 라 포커스와 접근성 트리에는 남는다 */}
            <input
              type="checkbox"
              checked={selected}
              onChange={() => toggle(option)}
              className="sr-only"
            />
            {option.label}
          </label>
        );
      })}
    </fieldset>
  );
}
