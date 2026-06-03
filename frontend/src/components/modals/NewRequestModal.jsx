import { useState, useRef, useMemo } from 'react'
import {
  Upload,
  X,
  Loader2,
  CheckCircle2,
  FileText,
  AlertCircle,
} from 'lucide-react'

import requestsApi from '../../api/requests.api'

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
const MAX_TOTAL_SIZE = 200 * 1024 * 1024 // 200MB
const MAX_FILES = 10

const ALLOWED_TYPES = [
  // Images
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',

  // PDF
  'application/pdf',

  // Videos
  'video/mp4',
  'video/webm',
  'video/quicktime',
]

export default function NewRequestModal({
  providerName,
  onClose,
  onSuccess,
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] =
    useState('')

  const [files, setFiles] = useState([])

  const [submitting, setSubmitting] =
    useState(false)

  const [dragOver, setDragOver] =
    useState(false)

  const [created, setCreated] =
    useState(null)

  const [errors, setErrors] =
    useState({})

  const [uploadError, setUploadError] =
    useState('')

  const fileInput = useRef(null)

  // ───────────────── Validation ─────────────────

  const totalFileSize = useMemo(() => {
    return files.reduce(
      (sum, file) => sum + file.size,
      0
    )
  }, [files])

  const validateTitle = (value) => {
    if (!value.trim())
      return 'Title is required'

    if (value.trim().length < 3)
      return 'Title must be at least 3 characters'

    if (value.trim().length > 500)
      return 'Title cannot exceed 500 characters'

    return ''
  }

  const validateDescription = (
    value
  ) => {
    if (!value.trim())
      return 'Description is required'

    if (value.trim().length < 10)
      return 'Description must be at least 10 characters'

    return ''
  }

  const validateForm = () => {
    const nextErrors = {}

    const titleError =
      validateTitle(title)

    const descriptionError =
      validateDescription(description)

    if (titleError)
      nextErrors.title = titleError

    if (descriptionError)
      nextErrors.description =
        descriptionError

    if (files.length > MAX_FILES) {
      nextErrors.files = `Maximum ${MAX_FILES} files allowed`
    }

    if (
      totalFileSize > MAX_TOTAL_SIZE
    ) {
      nextErrors.files =
        'Total upload size exceeds 200MB'
    }

    setErrors(nextErrors)

    return (
      Object.keys(nextErrors).length ===
      0
    )
  }

  // ───────────────── Files ─────────────────

  const handleFiles = (newFiles) => {
    const incoming = Array.from(
      newFiles
    )

    const validFiles = []

    let fileError = ''

    for (const file of incoming) {
      // duplicate prevention
      const duplicate = files.some(
        (f) =>
          f.name === file.name &&
          f.size === file.size
      )

      if (duplicate) continue

      // type validation
      if (
        !ALLOWED_TYPES.includes(
          file.type
        )
      ) {
        fileError = `${file.name} has unsupported file type`
        continue
      }

      // size validation
      if (
        file.size > MAX_FILE_SIZE
      ) {
        fileError = `${file.name} exceeds 50MB limit`
        continue
      }

      validFiles.push(file)
    }

    const updated = [
      ...files,
      ...validFiles,
    ]

    if (updated.length > MAX_FILES) {
      fileError = `Maximum ${MAX_FILES} files allowed`
    }

    const totalSize = updated.reduce(
      (sum, file) =>
        sum + file.size,
      0
    )

    if (
      totalSize > MAX_TOTAL_SIZE
    ) {
      fileError =
        'Total upload size exceeds 200MB'
    }

    if (fileError) {
      setErrors((prev) => ({
        ...prev,
        files: fileError,
      }))
    } else {
      setErrors((prev) => ({
        ...prev,
        files: '',
      }))
    }

    setFiles(
      updated.slice(0, MAX_FILES)
    )
  }

  const removeFile = (index) => {
    setFiles(
      files.filter(
        (_, i) => i !== index
      )
    )
  }

  // ───────────────── Submit ─────────────────

  const handleSubmit = async () => {
    setUploadError('')

    const valid = validateForm()

    if (!valid) return

    setSubmitting(true)

    try {
      const res =
        await requestsApi.create({
          title: title.trim(),
          description:
            description.trim(),
        })

      const newReq = res.data.data

      for (const file of files) {
        try {
          await requestsApi.uploadFile(
            newReq.id,
            file
          )
        } catch (err) {
          console.error(err)

          setUploadError(
            `Failed to upload ${file.name}`
          )
        }
      }

      setCreated(newReq)
    } catch (err) {
      console.error(err)

      setUploadError(
        'Failed to create request'
      )
    } finally {
      setSubmitting(false)
    }
  }

  // ───────────────── Success ─────────────────

  if (created) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl text-center">
          <div className="h-16 w-16 rounded-full bg-[#e6f5f0] flex items-center justify-center mx-auto mb-4">
            <CheckCircle2
              size={28}
              className="text-[#0f6e56]"
            />
          </div>

          <h2 className="text-[18px] font-semibold text-[#141a14] mb-1">
            Request sent!
          </h2>

          <p className="text-[13px] text-[#9ea89e] mb-6">
            We got it.{' '}
            {providerName} will
            review shortly.
          </p>

          <button
            onClick={() => {
              onSuccess(created)
              onClose()
            }}
            className="w-full rounded-xl bg-[#0f6e56] py-3 text-[14px] font-semibold text-white hover:bg-[#085041] transition-colors"
          >
            View my request
          </button>
        </div>
      </div>
    )
  }

  // ───────────────── UI ─────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
        <div className="p-6">

          {/* Header */}
          <div className="flex items-start justify-between mb-1">
            <h2 className="text-[20px] font-semibold text-[#141a14]">
              New request
            </h2>

            <button
              onClick={onClose}
              className="text-[#9ea89e] hover:text-[#141a14]"
            >
              <X size={18} />
            </button>
          </div>

          <p className="text-[13px] text-[#9ea89e] mb-5">
            Tell us what you need —
            we'll take care of the
            rest.
          </p>

          {/* Title */}
          <div className="mb-4">
            <label className="block text-[13px] font-semibold text-[#141a14] mb-2">
              What do you need help
              with?
            </label>

            <input
              value={title}
              onChange={(e) => {
                setTitle(
                  e.target.value
                )

                setErrors(
                  (prev) => ({
                    ...prev,
                    title:
                      validateTitle(
                        e.target.value
                      ),
                  })
                )
              }}
              placeholder="e.g. I need a new homepage banner"
              className={`
                w-full rounded-xl border px-3 py-2.5 text-[13px]
                outline-none transition-all
                ${
                  errors.title
                    ? 'border-red-300 focus:ring-red-100'
                    : 'border-[#e8eae8] focus:border-[#0f6e56] focus:ring-[#0f6e56]/10'
                }
                focus:ring-4
              `}
            />

            {errors.title && (
              <div className="flex items-center gap-1 mt-1.5 text-[12px] text-red-500">
                <AlertCircle size={12} />
                {errors.title}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="mb-4">
            <label className="block text-[13px] font-semibold text-[#141a14] mb-2">
              Tell us more
            </label>

            <textarea
              value={description}
              onChange={(e) => {
                setDescription(
                  e.target.value
                )

                setErrors(
                  (prev) => ({
                    ...prev,
                    description:
                      validateDescription(
                        e.target.value
                      ),
                  })
                )
              }}
              rows={4}
              placeholder="Add details, references, links, goals..."
              className={`
                w-full rounded-xl border px-3 py-2.5 text-[13px]
                outline-none resize-none transition-all
                ${
                  errors.description
                    ? 'border-red-300 focus:ring-red-100'
                    : 'border-[#e8eae8] focus:border-[#0f6e56] focus:ring-[#0f6e56]/10'
                }
                focus:ring-4
              `}
            />

            {errors.description && (
              <div className="flex items-center gap-1 mt-1.5 text-[12px] text-red-500">
                <AlertCircle size={12} />
                {errors.description}
              </div>
            )}
          </div>

          {/* Upload */}
          <div className="mb-5">
            <label className="block text-[13px] font-semibold text-[#141a14] mb-2">
              Attach files
            </label>

            <div
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() =>
                setDragOver(false)
              }
              onDrop={(e) => {
                e.preventDefault()
                setDragOver(false)

                handleFiles(
                  e.dataTransfer.files
                )
              }}
              onClick={() =>
                fileInput.current?.click()
              }
              className={`
                rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-colors
                ${
                  dragOver
                    ? 'border-[#0f6e56] bg-[#f0faf6]'
                    : 'border-[#d1e8df] bg-[#f7fbf9]'
                }
              `}
            >
              <div className="flex flex-col items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-[#e6f5f0] flex items-center justify-center">
                  <Upload
                    size={18}
                    className="text-[#0f6e56]"
                  />
                </div>

                <p className="text-[13px] font-medium text-[#141a14]">
                  Drag files here or
                  browse to upload
                </p>

                <p className="text-[12px] text-[#9ea89e]">
                  Images, videos and PDFs · Max 50MB per file
                </p>
              </div>

              <input
                ref={fileInput}
                type="file"
                multiple
                accept="image/*,video/mp4,video/webm,video/quicktime,.pdf"
                className="hidden"
                onChange={(e) =>
                  handleFiles(
                    e.target.files
                  )
                }
              />
            </div>

            {errors.files && (
              <div className="flex items-center gap-1 mt-2 text-[12px] text-red-500">
                <AlertCircle size={12} />
                {errors.files}
              </div>
            )}

            {files.length > 0 && (
              <div className="mt-3 space-y-2">
                {files.map(
                  (file, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 rounded-lg bg-[#f7f8f7] px-3 py-2"
                    >
                      <FileText
                        size={13}
                        className="text-[#9ea89e]"
                      />

                      <div className="flex-1 min-w-0">
                        <p className="truncate text-[12px] text-[#141a14]">
                          {
                            file.name
                          }
                        </p>

                        <p className="text-[11px] text-[#9ea89e]">
                          {(
                            file.size /
                            1024 /
                            1024
                          ).toFixed(2)}{' '}
                          MB
                        </p>
                      </div>

                      <button
                        onClick={() =>
                          removeFile(
                            index
                          )
                        }
                      >
                        <X
                          size={13}
                          className="text-[#9ea89e]"
                        />
                      </button>
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          {/* Upload Error */}
          {uploadError && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-600">
              {uploadError}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full rounded-xl bg-[#0f6e56] py-3.5 text-[14px] font-semibold text-white hover:bg-[#085041] disabled:opacity-50"
          >
            {submitting ? (
              <Loader2
                size={16}
                className="animate-spin mx-auto"
              />
            ) : (
              'Send request'
            )}
          </button>

          <p className="mt-3 text-center text-[12px] text-[#9ea89e]">
            🔒 Only {providerName}{' '}
            can see your request
          </p>
        </div>
      </div>
    </div>
  )
}

