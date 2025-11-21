import process from 'node:process'

export function getEnv(env, Astro, name) {
  // 兼容两种调用方式：(env, Astro, name) 或 (name, env, Astro)
  let envName
  if (typeof name === 'string') {
    envName = name
  }
  else if (typeof env === 'string') {
    envName = env
    env = Astro
    Astro = name
  }

  return env?.[envName] ?? Astro?.locals?.runtime?.env?.[envName] ?? import.meta.env?.[envName] ?? process.env?.[envName]
}
