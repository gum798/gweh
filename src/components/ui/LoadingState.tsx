interface LoadingStateProps {
  label: string;
}

// 같은 "분석 중" 순간에 로딩 화면이 6가지였다.
//
// label 은 필수다. 이 영역은 role="status" + aria-live="polite" 라서 label 이
// 없으면 스크린리더에 아무것도 읽히지 않는다 — 살아 있지만 말이 없는 영역이 된다.
// 여기에 기본 문구를 박으면 ko/en 중 하나가 반드시 틀리므로 그럴 수는 없고,
// 대신 타입으로 강제한다. 이러면 "호출부가 잊지 않기를 바란다"가 컴파일 에러가 되어
// 로딩 화면 6곳 전부에서 t() 로 만든 문구를 넘기게 된다. 문자열도 로케일 키도
// 이 파일에 늘지 않는다.
export function LoadingState({ label }: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="min-h-[50vh] flex flex-col items-center justify-center gap-5 px-6"
    >
      <div className="h-14 w-14 rounded-gal-xl border border-gal-border flex items-center justify-center">
        <span
          className="h-6 w-6 rounded-full border-2 border-gal-accent-ink border-t-transparent animate-spin"
          aria-hidden="true"
        />
      </div>
      {label && <p className="text-sm text-gal-body text-center">{label}</p>}
    </div>
  );
}
