import { Redirect } from "expo-router";

export default function ExploreTab() {
  return <Redirect href={{ pathname: "/division/[type]", params: { type: "shortlet" } }} />;
}
