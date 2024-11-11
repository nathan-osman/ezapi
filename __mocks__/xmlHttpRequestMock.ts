export const openMock = jest.fn()
export const setRequestHeaderMock = jest.fn()

export const sendMock = jest.fn(function (formData: FormData) {
  this.readyState = 4
  this.status = XMLHttpRequestMock.status
  this.responseText = XMLHttpRequestMock.responseText
  if (this.onreadystatechange) {
    this.onreadystatechange()
  }
})

export class XMLHttpRequestMock {
  constructor() { }

  open = openMock
  send = sendMock
  setRequestHeader = setRequestHeaderMock

  static DONE = 4

  static status?: number
  static responseText?: string

  static mockData(status?: number, responseText?: string) {
    XMLHttpRequestMock.status = status
    XMLHttpRequestMock.responseText = responseText
  }

  static resetMocks() {
    XMLHttpRequestMock.mockData()
  }
}

(global as any).XMLHttpRequest = XMLHttpRequestMock
