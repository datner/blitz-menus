import Link from "next/link"
import login from "app/auth/mutations/login"
import { useMutation } from "@blitzjs/rpc"
import { BlitzPage, Routes } from "@blitzjs/next"
import Layout from "app/core/layouts/Layout"
import { useCurrentUser } from "app/core/hooks/useCurrentUser"
import logout from "app/auth/mutations/logout"
import {
  Container,
  Title,
  Text,
  Anchor,
  Paper,
  TextInput,
  PasswordInput,
  Group,
  Button,
  Loader,
} from "@mantine/core"
import styles from "styles/index.module.css"
import clsx from "clsx"
import { useZodForm } from "app/core/hooks/useZodForm"
import { Login } from "app/auth/validations"
import { AuthenticationError } from "blitz"
import { useRouter } from "next/router"

/*
 * This file is just for a pleasant getting started page for your new app.
 * You can delete everything in here and start from scratch if you like.
 */

const UserInfo = () => {
  const currentUser = useCurrentUser()
  const [logoutMutation] = useMutation(logout)

  if (currentUser) {
    return (
      <>
        <button
          className={clsx(styles.button, styles.small)}
          onClick={async () => {
            await logoutMutation()
          }}
        >
          Logout
        </button>
        <div>
          User id: <code>{currentUser.id}</code>
          <br />
          User role: <code>{currentUser.role}</code>
        </div>
      </>
    )
  } else {
    return (
      <>
        <Link href={Routes.UserSignupPage()}>
          <a className={clsx(styles.button, styles.small)}>
            <strong>Sign Up</strong>
          </a>
        </Link>
        <Link href={Routes.LoginPage()}>
          <a className={clsx(styles.button, styles.small)}>
            <strong>Login</strong>
          </a>
        </Link>
      </>
    )
  }
}

function LoginForm() {
  const router = useRouter()
  const [loginMutation] = useMutation(login)
  const form = useZodForm({
    schema: Login,
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await loginMutation(data)
      router.push(Routes.AdminHome())
    } catch (error: unknown) {
      if (error instanceof AuthenticationError) {
        return form.setFormError("Sorry, those credentials are invalid")
      }

      if (error instanceof Error) {
        return form.setFormError(
          "Sorry, we had an unexpected error. Please try again. - " + error.toString()
        )
      }

      return form.setFormError("Sorry, we had an unexpected error. Please try again.")
    }
  })

  return (
    <Paper
      component="form"
      withBorder
      shadow="md"
      p={30}
      mt={30}
      radius="md"
      onSubmit={handleSubmit}
    >
      <fieldset disabled={form.formState.isSubmitting}>
        <TextInput
          {...form.register("email", { required: true })}
          label="Email"
          placeholder="you@renu.menu"
        />
        <PasswordInput
          {...form.register("password", { required: true })}
          label="Password"
          placeholder="your password"
          mt="md"
        />
        <Group position="apart" mt="md">
          <Anchor<"a"> size="sm" href="#" onClick={(e) => e.preventDefault()}>
            Forgot Password?
          </Anchor>
        </Group>
      </fieldset>
      <Button type="submit" fullWidth mt="xl">
        {form.formState.isSubmitting ? <Loader /> : "Sign In"}
      </Button>
    </Paper>
  )
}

const Authentication: BlitzPage = () => {
  return (
    <Container size={420} my={40}>
      <Title align="center" weight="bolder">
        Welcome back!
      </Title>
      <Text color="dimmed" size="sm" align="center" mt={5}>
        Do you not have an account yet?{" "}
        <Anchor<"a"> size="sm" href="#" onClick={(e) => e.preventDefault()}>
          Create Account
        </Anchor>
      </Text>

      <LoginForm />
    </Container>
  )
}

const Home: BlitzPage = () => {
  return (
    <div className={styles.container}>
      <main>
        <div className="logo"></div>
        <p>
          <strong>Congrats!</strong> Your app is ready, including user sign-up and log-in.
        </p>
        <div className="buttons" style={{ marginTop: "1rem", marginBottom: "1rem" }}>
          <UserInfo />
        </div>
        <p>
          <strong>
            To add a new model to your app, <br />
            run the following in your terminal:
          </strong>
        </p>
        <pre>
          <code>blitz generate all project name:string</code>
        </pre>
        <div style={{ marginBottom: "1rem" }}>(And select Yes to run prisma migrate)</div>
        <div>
          <p>
            Then <strong>restart the server</strong>
          </p>
          <pre>
            <code>Ctrl + c</code>
          </pre>
          <pre>
            <code>blitz dev</code>
          </pre>
          <p>
            and go to{" "}
            <Link href="/projects">
              <a>/projects</a>
            </Link>
          </p>
        </div>
        <div className="buttons" style={{ marginTop: "5rem" }}>
          <a
            className="button"
            href="https://blitzjs.com/docs/getting-started?utm_source=blitz-new&utm_medium=app-template&utm_campaign=blitz-new"
            target="_blank"
            rel="noopener noreferrer"
          >
            Documentation
          </a>
          <a
            className="button-outline"
            href="https://github.com/blitz-js/blitz"
            target="_blank"
            rel="noopener noreferrer"
          >
            Github Repo
          </a>
          <a
            className="button-outline"
            href="https://discord.blitzjs.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            Discord Community
          </a>
        </div>
      </main>

      <footer>
        <a
          href="https://blitzjs.com?utm_source=blitz-new&utm_medium=app-template&utm_campaign=blitz-new"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by Blitz.js
        </a>
      </footer>
    </div>
  )
}

Home.suppressFirstRenderFlicker = true
Home.getLayout = (page) => <Layout title="Home">{page}</Layout>
Authentication.redirectAuthenticatedTo = Routes.AdminHome()
Authentication.suppressFirstRenderFlicker = true
Authentication.getLayout = (page) => <Layout title="Home">{page}</Layout>

export default Authentication
