const ids = [4068314, 5083491, 47261, 6969962, 5081930, 4549408, 4482900, 3850250, 5077047, 4386370, 4145191, 3182739, 1092644]
for (const id of ids) {
  const url = `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop`
  const res = await fetch(url, { headers: { 'User-Agent': 'FlaireStack/1.0' } })
  console.log(id, res.status)
}
