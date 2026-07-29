interface LoadingStateProps {
  label?: string;
}

// 같은 "분석 중" 순간에 로딩 화면이 6가지였다.
//
// label 은 prop 이다 — 여기에 문구를 박으면 ko/en 중 하나가 반드시 틀린다.
// role="status" + aria-live="polite" 영역이므로 label 이 없으면 스크린리더에
// 아무것도 읽히지 않는다. 호출부는 t() 로 만든 label 을 항상 넘기는 것이 좋다.
export function LoadingState({ label }: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="min-h-[50vh] flex flex-col items-center justify-center gap-5 px-6"
    >
      <div className="h-14 w-14 rounded-gal-xl border border-gal-border flex items-center justify-center">
        <span
          className="h-6 w-6 rounded-full border-2 border-gal-accent border-t-transparent animate-spin"
          aria-hidden="true"
        />
      </div>
      {label && <p className="text-sm text-gal-body text-center">{label}</p>}
    </div>
  );
}
