let channels = new Map();

function subscribe(channel, listener) {
  if (!channels.has(channel)) channels.set(channel, new Set());
  channels.get(channel).add(listener);
  return this;
}

function unsubscribe(topic, listener) {
  let channel = channels.get(topic);
  if (channel) {
    channel.delete(listener);
    if (channel.length == 0) channels.delete(topic);
  }
  return this;
}

function publish(msg, ...data) {
  _publish(false, msg, data);
  return this;
}

function publishSync(msg, ...data) {
  _publish(true, msg, data);
  return this;
}

function _publish(sync, msg, data) {
  let list = subscribers(msg);
  if (list.length == 0) return;
  let send = envelop(list, msg, data);

  if (sync) send();
  else setTimeout(send, 0);
}

function subscribers(msg) {
  let topic = String(msg), list = [], channel, idx;
  while (true) {
    if (channels.has(topic)) list.push(topic);

    idx = topic.lastIndexOf('.');
    if (idx == -1) break;
    topic = topic.substring(0, idx);
  }
  return list;
}

function envelop(subscribers, msg, data) {
  return () => {
    subscribers.forEach(topic => broadcast(topic, msg, data));
  }
}

function broadcast(topic, msg, data) {
  let channel = channels.get(topic) || {};
  for (let listener of channel) {
    listener(topic, ...data);
  }
}