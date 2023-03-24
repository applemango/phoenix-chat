defmodule RealtimeWeb.FriendChannel do
  use Phoenix.Channel

  def join("friend:" <> user_id, %{"token" => token}, socket) do
    {:ok, claims} = RealtimeWeb.Token.verify_and_validate(token)
    sub = claims["sub"]
    if user_id == sub do
      {:ok, socket}
    else
      {:error, %{reason: "unauthorized"}}
    end
  end

  def handle_in("request", %{"token" => token, "user_id" => user_id}, socket) do
    {:ok, claims} = RealtimeWeb.Token.verify_and_validate(token)
    sub = claims["sub"]

    RealtimeWeb.Endpoint.broadcast "friend:" <> to_string(user_id) , "request", %{user_id: sub}

    {:noreply, socket}
  end

  def handle_in("response", %{"token" => token, "status" => status, "user_id" => user_id}, socket) do
    {:ok, claims} = RealtimeWeb.Token.verify_and_validate(token)
    sub = claims["sub"]

    RealtimeWeb.Endpoint.broadcast "friend:" <> to_string(user_id) , "response", %{user_id: sub, status: status}

    {:noreply, socket}
  end

end
