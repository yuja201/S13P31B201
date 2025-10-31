export const fakerMapper: Record<string, string> = {
  이름: 'person.firstName',
  성: 'person.lastName',
  '전체 이름': 'person.fullName',
  직업명: 'person.jobTitle',

  '도로명 주소': 'location.streetAddress',
  도시: 'location.city',
  국가: 'location.country',
  우편번호: 'location.zipCode',

  이메일: 'internet.email',
  전화번호: 'phone.number',
  사용자명: 'internet.userName',
  도메인: 'internet.domainName',

  회사명: 'company.name',
  슬로건: 'company.catchPhrase',
  부서: 'commerce.department',

  계좌번호: 'finance.accountNumber',
  금액: 'finance.amount',
  카드번호: 'finance.creditCardNumber',

  상품명: 'commerce.productName',
  카테고리: 'commerce.department',
  가격: 'commerce.price',
  설명: 'lorem.sentence',

  UUID: 'string.uuid',
  정수: 'number.int',
  실수: 'number.float',
  불리언: 'datatype.boolean',
  문장: 'lorem.sentence',
  문단: 'lorem.paragraph',
  단어: 'lorem.word',
  색상명: 'color.human',
  'HEX 코드': 'color.hex',
  '이미지 URL': 'image.url'
}
