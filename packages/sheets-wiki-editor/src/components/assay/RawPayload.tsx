interface Props {
  payload: unknown
  label?: string
  defaultOpen?: boolean
}

export function RawPayload({ payload, label = "raw payload", defaultOpen = false }: Props) {
  const json = JSON.stringify(payload, null, 2)
  return (
    <details class="raw-payload" open={defaultOpen}>
      <summary>
        <span>{label}</span>
        <button
          type="button"
          class="raw-payload-copy"
          onClick={(e) => {
            e.preventDefault()
            void navigator.clipboard.writeText(json)
          }}
        >
          copy
        </button>
      </summary>
      <pre>{json}</pre>
    </details>
  )
}
