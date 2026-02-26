export function applyAcademyRealtimeUpdate(prev, message) {
  if (!message || typeof message !== 'object') return prev

  if (message.type === 'training') {
    if (message.action === 'created') {
      const exists = prev.trainings.some((item) => item.id === message.training?.id)
      if (exists || !message.training) return prev
      return { ...prev, trainings: [message.training, ...prev.trainings] }
    }

    if (message.action === 'updated') {
      if (!message.training?.id) return prev
      return {
        ...prev,
        trainings: prev.trainings.map((item) =>
          item.id === message.training.id ? { ...item, ...message.training } : item
        ),
      }
    }

    if (message.action === 'destroyed') {
      return {
        ...prev,
        trainings: prev.trainings.filter((item) => item.id !== message.trainingId),
        trainingSessions: prev.trainingSessions.filter((item) => item.trainingId !== message.trainingId),
        trainingRegistrations: prev.trainingRegistrations.filter((item) => item.trainingId !== message.trainingId),
      }
    }
  }

  if (message.type === 'session') {
    if (message.action === 'created') {
      const exists = prev.trainingSessions.some((item) => item.id === message.session?.id)
      if (exists || !message.session) return prev
      return { ...prev, trainingSessions: [...prev.trainingSessions, message.session] }
    }

    if (message.action === 'updated') {
      if (!message.session?.id) return prev
      return {
        ...prev,
        trainingSessions: prev.trainingSessions.map((item) =>
          item.id === message.session.id ? { ...item, ...message.session } : item
        ),
      }
    }

    if (message.action === 'destroyed') {
      return {
        ...prev,
        trainingSessions: prev.trainingSessions.filter((item) => item.id !== message.sessionId),
      }
    }
  }

  return prev
}
