/**
 * 이미 i18n 번역을 거쳐 사용자에게 그대로 노출해도 되는 감지 실패를 표시한다.
 *
 * 이것이 없으면 catch 블록에서 "우리가 의도적으로 던진 안내 메시지"와
 * "예기치 못한 런타임 예외"를 구분할 수 없다. 구분하지 못하면 모든 실패가
 * 같은 문구로 뭉개지고, 원인 진단이 불가능해진다 — 실제로 그래서
 * 카메라 버그의 원인을 4개월간 특정하지 못했다.
 */
export class DetectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DetectionError';
  }
}
