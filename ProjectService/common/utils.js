const getPagination = (object) => {
  const {
    totalDocs,
    prevPage,
    page,
    nextPage,
    totalPages,
    hasPrevPage,
    hasNextPage,
  } = object;
  const itemsArray = Array.from(Array(totalPages + 1).keys()).slice(1);
  return {
    total: totalDocs,
    previous_page: prevPage || 0,
    current_page: page || 0,
    next_page: nextPage || 0,
    items: itemsArray,
    total_pages: totalPages,
    has_prev_page: hasPrevPage,
    has_next_page: hasNextPage,
  };
};
module.exports = {
  getPagination
};
