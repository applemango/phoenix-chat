defmodule RealtimeWeb.NotificationChannel do
  use Phoenix.Channel

  def join("notification:" <> user_id, %{"ids" => ids}, socket) do
    topics = for room_id <- ids, do: "room:#{room_id}"

    {:ok, socket
          |> assign(:topics, [])
          |> put_new_topics(topics)}
  end

  def handle_in("watch", %{"room_id" => id}, socket) do
    {:reply, :ok, put_new_topics(socket, ["room:#{id}"])}
  end

  def handle_in("unwatch", %{"room_id" => id}, socket) do
    {:reply, :ok, RealtimeWeb.Endpoint.unsubscribe("room:#{id}")}
  end

  defp put_new_topics(socket, topics) do
    Enum.reduce(topics, socket, fn topic, acc ->
      topics = acc.assigns.topics
      if topic in topics do
        acc
      else
        :ok = RealtimeWeb.Endpoint.subscribe(topic)
        assign(acc, :topics, [topic | topics])
      end
    end)
  end

  alias Phoenix.Socket.Broadcast
  def handle_info(%Broadcast{topic: topic, event: event, payload: payload}, socket) do
    #IO.puts("hello:")
    #RealtimeWeb.Endpoint.broadcast "notification:test", "new_msg", %{body: payload}
    """
    コメントにそんなん書くのはいやだけど、というか良くないけど

    めっちゃ凡ミスした

    useChannelOnEvent("new_msg", (msg)=> {
      console.log(msg)
    }, channel)

    上のコードで無理だったからやり方が悪いのかと思ったら下のコードだったらいけたよ
    setChannel(channel_)を入れて更新するの忘れてた、2,3時間返せ

    channel_.on("new_msg", (msg) => {
      console.log("Notification:", msg)
    })
    """
    push(socket, event, %{body: payload, from: %{topic: topic, event: event}})
    {:noreply, socket}
  end
end
