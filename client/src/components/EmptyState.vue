<template>
  <div class="empty-state">
    <h3>{{ $t('empty_state.title') }}</h3>
    <i class="large material-icons">priority_high</i>
    <p>{{ $t('empty_state.message') }}</p>
  </div>
</template>

<script>
export default {
  name: 'EmptyState'
}
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-flow: column;
  height: calc(100vh - 68px - 8px); /* 68px == header height and 8px == episode padding top. Alright this is far from perfect */
  max-width: 90vw;
  text-align: center;
  margin: auto;
  align-items: center;
  justify-content: center;
}

.empty-state i {
  margin: 30px auto;
  font-size: 90px;
  color: #ccc;
  transform: scale(2, 2);
}

.empty-state h3{
  margin: 8px 0px;
  font-weight: normal;
}

.empty-state p{
  font-size: 14px;
  margin: 10px 0px;
  color: #999;
}

.empty-state a {
  margin: 0 auto;
}

#app.bottombarActive .empty-state {
  height: calc(100vh - 68px - 56px);
}
</style>