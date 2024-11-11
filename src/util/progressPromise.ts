type ProgressCallback = (value: number) => void

/**
 * Promise that can report request progress
 */
export class ProgressPromise<T> extends Promise<T> {

  progressCallbacks: Array<ProgressCallback> = []

  constructor(
    executor: (
      resolve: (value: T | PromiseLike<T>) => void,
      reject: (reason?: any) => void,
      progress: (value: number) => void,
    ) => void,
  ) {
    super((resolve, reject) => {
      return executor(resolve, reject, v => {
        this.progressCallbacks.forEach(c => c(v))
      })
    })
  }

  progress(callback: ProgressCallback): this {
    this.progressCallbacks.push(callback)
    return this
  }
}
