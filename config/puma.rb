max_threads_count = ENV.fetch("RAILS_MAX_THREADS", 5)
min_threads_count = ENV.fetch("RAILS_MIN_THREADS", max_threads_count)
threads min_threads_count, max_threads_count

port ENV.fetch("PORT", 3000)
environment ENV.fetch("RAILS_ENV", "development")

pidfile ENV.fetch("PIDFILE", "tmp/pids/server.pid")

# In cluster mode, allow workers to handle long-running uploads (350 Mo+)
# without being killed by the master process (default: 60s).
worker_timeout ENV.fetch("PUMA_WORKER_TIMEOUT", 600).to_i

plugin :tmp_restart
