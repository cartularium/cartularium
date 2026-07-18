interface SignInProps {
  returnPath: string
}

export function SignIn({ returnPath }: SignInProps) {
  const handleClick = () => {
    const url = `/api/edit/auth/login?redirect=${encodeURIComponent(returnPath)}`
    window.location.assign(url)
  }

  return (
    <div class="signin-host">
      <div class="signin-card">
        <h1 class="signin-title">edit-wiki</h1>
        <p class="signin-blurb">
          edit-wiki uses your github account to attribute and submit your contributions as pull requests.
        </p>
        <button type="button" class="signin-btn" onClick={handleClick}>
          sign in with github
        </button>
      </div>
    </div>
  )
}
