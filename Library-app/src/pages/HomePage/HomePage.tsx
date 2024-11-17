import { LoginForm } from "../../features/authentication/components/LoginForm/LoginForm";
import { User } from "../../models/User";
interface HomePageProps {
    displayLogin: boolean;
}

export default function HomePage(props: HomePageProps): JSX.Element {
  return (
    <div className="page">
      Home Page
      {props.displayLogin ? <LoginForm /> : <></>}
    </div>
  )
}